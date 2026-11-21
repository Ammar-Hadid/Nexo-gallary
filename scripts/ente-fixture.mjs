import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { deflateSync } from 'node:zlib';

const exec = promisify(execFile);
const marker = 'NEXO_SYNTHETIC_MEDIA_MARKER_2026';
const filename = 'nexo-gallery-synthetic.png';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, payload) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(payload.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, payload])));
  return Buffer.concat([length, name, payload, checksum]);
}

function syntheticPNG() {
  const width = 128;
  const height = 96;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // Eight-bit RGB.
  header[9] = 2;

  const rows = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = y * (1 + width * 3) + 1 + x * 3;
      const redStripe = x > 18 && x < 110 && y > 30 && y < 66;
      rows[offset] = redStripe ? 239 : 36 + Math.floor(x / 3);
      rows[offset + 1] = redStripe ? 62 : 42 + Math.floor(y / 2);
      rows[offset + 2] = redStripe ? 74 : 68 + Math.floor(x / 4);
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('tEXt', Buffer.from(`Description\0${marker}`, 'utf8')),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function run(binary, args) {
  try {
    const { stdout } = await exec(binary, args, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      timeout: 30_000,
    });
    return stdout.trim();
  } catch {
    throw new Error(`Could not complete the read-only ${binary} check`);
  }
}

async function prepare(output) {
  const bytes = syntheticPNG();
  await writeFile(output, bytes, { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({
    fixture: output,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    size: bytes.length,
    marker,
  }, null, 2));
}

async function verify(download) {
  if (!download) throw new Error('Usage: node scripts/ente-fixture.mjs verify downloaded.png');
  const actual = await readFile(download);
  const expected = syntheticPNG();
  const matches = actual.equals(expected);
  console.log(JSON.stringify({
    matches_synthetic_fixture: matches,
    downloaded_sha256: createHash('sha256').update(actual).digest('hex'),
    expected_sha256: createHash('sha256').update(expected).digest('hex'),
  }, null, 2));
  if (!matches) process.exitCode = 1;
}

async function audit() {
  const compose = process.env.NEXO_ENTE_COMPOSE_FILE;
  const project = process.env.NEXO_ENTE_PROJECT ?? 'nexo_ente_eval';
  if (!compose) throw new Error('Set NEXO_ENTE_COMPOSE_FILE to the isolated test Compose file');
  if (!/^[a-zA-Z0-9_-]+$/.test(project)) throw new Error('Invalid Compose project name');
  const base = ['compose', '-p', project, '-f', compose];

  const sql = `SELECT json_build_object(
    'users', (SELECT count(*) FROM users),
    'collections', (SELECT count(*) FROM collections WHERE NOT is_deleted),
    'files', (SELECT count(*) FROM files),
    'file_data_rows', (SELECT count(*) FROM file_data WHERE NOT is_deleted),
    'encrypted_metadata_rows', (SELECT count(*) FROM files WHERE length(encrypted_metadata) > 0),
    'encrypted_album_name_rows', (SELECT count(*) FROM collections WHERE length(encrypted_name) > 0),
    'plaintext_album_name_rows', (SELECT count(*) FROM collections WHERE length(name) > 0),
    'encrypted_collection_file_keys', (SELECT count(*) FROM collection_files WHERE length(encrypted_key) > 0),
    'marker_in_file_rows', (SELECT count(*) FROM files f WHERE strpos(to_jsonb(f)::text, '${marker}') > 0),
    'filename_in_file_rows', (SELECT count(*) FROM files f WHERE strpos(to_jsonb(f)::text, '${filename}') > 0),
    'marker_in_collection_rows', (SELECT count(*) FROM collections c WHERE strpos(to_jsonb(c)::text, '${marker}') > 0)
  )::text`;
  const database = JSON.parse(await run('docker', [
    ...base, 'exec', '-T', 'postgres', 'psql', '-U', 'pguser', '-d', 'ente_db',
    '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', sql,
  ]));

  const minio = await run('docker', [...base, 'ps', '-q', 'minio']);
  if (!/^[a-f0-9]{12,64}$/.test(minio)) throw new Error('Isolated MinIO container is unavailable');
  const volumeScript = `count=$(find /data -type f ! -path '/data/.minio.sys/*' | wc -l | tr -d ' ')
match=$(find /data -type f ! -path '/data/.minio.sys/*' -exec grep -F -q "$1" {} \\; -print -quit)
if [ -n "$match" ]; then found=yes; else found=no; fi
printf '%s %s\\n' "$count" "$found"`;
  const volume = await run('docker', [
    'run', '--rm', '--volumes-from', `${minio}:ro`, '--entrypoint', 'sh',
    'alpine/socat', '-c', volumeScript, 'audit', marker,
  ]);
  const [payloadFileCount, match] = volume.split(/\s+/);
  const storage = {
    payload_files: Number(payloadFileCount),
    synthetic_marker_found: match === 'yes',
  };
  if (!Number.isSafeInteger(storage.payload_files) || !['yes', 'no'].includes(match)) {
    throw new Error('Invalid isolated object-store audit result');
  }
  const leaked = storage.synthetic_marker_found ||
    database.marker_in_file_rows > 0 ||
    database.filename_in_file_rows > 0 ||
    database.marker_in_collection_rows > 0 ||
    database.plaintext_album_name_rows > 0;
  const status = leaked ? 'leak_detected' : database.files === 0 ? 'awaiting_upload' : 'observations_only';

  console.log(JSON.stringify({
    status,
    database,
    storage,
    limitation: 'This audit does not prove client-side encryption, download/decryption, or safe retry behavior.',
  }, null, 2));
  if (leaked) process.exitCode = 1;
  else if (database.files === 0) process.exitCode = 2;
}

try {
  if (process.argv[2] === 'prepare') {
    await prepare(process.argv[3] ?? `/tmp/${filename}`);
  } else if (process.argv[2] === 'verify') {
    await verify(process.argv[3]);
  } else if (process.argv[2] === 'audit') {
    await audit();
  } else {
    throw new Error('Usage: node scripts/ente-fixture.mjs prepare [output.png] | verify downloaded.png | audit');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

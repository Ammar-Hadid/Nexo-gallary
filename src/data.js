export const media = [
  { id: 'm01', title: 'Quiet road', date: '2026-11-09', place: 'Kyoto, Japan', type: 'photo', album: 'Japan notes', tags: 'street travel autumn', image: 'photo-1493976040374-85c8e12f0c0e' },
  { id: 'm02', title: 'Evening coastline', date: '2026-11-07', place: 'Zandvoort, Netherlands', type: 'photo', album: 'Coastlines', tags: 'sea sunset beach', image: 'photo-1507525428034-b723cf961d3e' },
  { id: 'm03', title: 'Mountain air', date: '2026-10-21', place: 'Lauterbrunnen, Switzerland', type: 'photo', album: 'Mountain light', tags: 'mountains valley travel', image: 'photo-1501785888041-af3ef285b470' },
  { id: 'm04', title: 'Old streets', date: '2026-10-11', place: 'Kyoto, Japan', type: 'photo', album: 'Japan notes', tags: 'city street architecture', image: 'photo-1519501025264-65ba15a82390' },
  { id: 'm05', title: 'A slower morning', date: '2026-09-23', place: 'Rotterdam, Netherlands', type: 'photo', album: 'Everyday', tags: 'coffee morning table', image: 'photo-1445116572660-236099ec97a0' },
  { id: 'm06', title: 'Into the trees', date: '2026-09-14', place: 'Veluwe, Netherlands', type: 'photo', album: 'Everyday', tags: 'forest trees green', image: 'photo-1441974231531-c6227db76b6e' },
  { id: 'm07', title: 'Blue hour', date: '2026-08-30', place: 'Lauterbrunnen, Switzerland', type: 'video', album: 'Mountain light', tags: 'lake mountains water', image: 'photo-1470770841072-f978cf4d019e' },
  { id: 'm08', title: 'Far horizon', date: '2026-08-18', place: 'Zandvoort, Netherlands', type: 'photo', album: 'Coastlines', tags: 'sea waves horizon', image: 'photo-1518837695005-2083093ee35b' },
  { id: 'm09', title: 'The long way home', date: '2026-08-02', place: 'Rotterdam, Netherlands', type: 'photo', album: 'Everyday', tags: 'road travel landscape', image: 'photo-1500534623283-312aade485b7' },
];

export const photo = (item, width = 900) => `https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=${width}&q=80`;

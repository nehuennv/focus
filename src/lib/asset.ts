// Resuelve rutas de assets públicos respetando el base de Vite.
// dev: base '/' → '/img/x.png'. GitHub Pages: base '/focus/' → '/focus/img/x.png'.
export const asset = (path: string) =>
  import.meta.env.BASE_URL + path.replace(/^\//, '');

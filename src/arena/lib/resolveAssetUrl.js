export function resolveBackendAssetUrl(path) {
  if (!path) return '';
  const trimmedPath = path.trim();
  if (!trimmedPath) return '';
  if (trimmedPath.startsWith('data:') || trimmedPath.startsWith('blob:')) return trimmedPath;
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) return trimmedPath;

  let normalized = trimmedPath.replace(/\\/g, '/');

  // Preserve /arena/ template asset paths — these are served from dist/arena/templates/{template}/static/
  const arenaIdx = normalized.indexOf('/arena/');
  if (arenaIdx !== -1) {
    normalized = normalized.slice(arenaIdx);
    if (!normalized.startsWith('/')) normalized = '/' + normalized;
    return normalized;
  }

  const appDataIdx = normalized.indexOf('/app_data/');
  if (appDataIdx !== -1) {
    normalized = normalized.slice(appDataIdx);
  } else {
    const staticIdx = normalized.indexOf('/static/');
    if (staticIdx !== -1) {
      normalized = normalized.slice(staticIdx);
    } else {
      const imagesIdx = normalized.lastIndexOf('/images/');
      if (imagesIdx !== -1) normalized = '/app_data' + normalized.slice(imagesIdx);
      else {
        const uploadsIdx = normalized.lastIndexOf('/uploads/');
        if (uploadsIdx !== -1) normalized = '/app_data' + normalized.slice(uploadsIdx);
        else {
          const fontsIdx = normalized.lastIndexOf('/fonts/');
          if (fontsIdx !== -1) normalized = '/app_data' + normalized.slice(fontsIdx);
        }
      }
    }
  }

  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  return normalized;
}

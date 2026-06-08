const toolModules = import.meta.glob('./*Tool.jsx', { eager: true });

export const registeredTools = Object.keys(toolModules)
  .map((key) => toolModules[key].default)
  .filter((tool) => tool && tool.id);

export function findToolById(toolId) {
  return registeredTools.find((tool) => tool.id === toolId);
}

export function findToolForMarker(marker) {
  return registeredTools.find((tool) => tool.match && tool.match(marker));
}

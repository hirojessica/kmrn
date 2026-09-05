// English copy lives alongside Japanese copy in Shopify's gallery editor.
export function localizedGalleryItem(node, language = 'ja') {
  const fields = Object.fromEntries((node.fields || []).map(field => [field.key, field]));
  const text = key => (language === 'en' ? fields[`${key}_en`]?.value : '') || fields[key]?.value || '';
  const title = text('title');
  const sourceImage = fields.image?.reference?.image;
  const image = sourceImage ? { ...sourceImage, altText: language === 'en' ? title : sourceImage.altText || title } : undefined;
  return { id: node.id, title, caption: text('caption'), category: text('category'), image };
}

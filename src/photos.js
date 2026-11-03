export const MAX_PRODUCT_PHOTOS = 8;
export const MAX_SOURCE_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_PHOTO_BYTES = 2 * 1024 * 1024;

// Keep old single-image products readable without a database migration.
export function productPhotos(product) {
  const source = Array.isArray(product?.images) && product.images.length
    ? product.images : [product?.image];
  return [...new Set(source.filter(url => typeof url === 'string' && url.trim()).map(url => url.trim()))];
}

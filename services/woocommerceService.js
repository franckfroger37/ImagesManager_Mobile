import * as FileSystem from 'expo-file-system';

export const testWooConnection = async (settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  if (!wooUrl || !consumerKey || !consumerSecret) throw new Error('Paramètres WooCommerce manquants');

  const url = `${wooUrl}/wp-json/wc/v3/products?per_page=1&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Erreur ${response.status}`);
  }
  return true;
};

export const testWpAuth = async (settings) => {
  const { wooUrl, wpUsername, wpAppPassword } = settings;
  if (!wooUrl || !wpUsername || !wpAppPassword) throw new Error('Identifiants WordPress manquants');

  const credentials = btoa(`${wpUsername}:${wpAppPassword}`);
  const url = `${wooUrl}/wp-json/wp/v2/users/me`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) throw new Error(`Authentification échouée (${response.status})`);
  const data = await response.json();
  return data.name || wpUsername;
};

export const uploadImage = async (imageUri, refName, settings) => {
  const { wooUrl, wpUsername, wpAppPassword } = settings;
  const credentials = btoa(`${wpUsername}:${wpAppPassword}`);

  const url = `${wooUrl}/wp-json/wp/v2/media`;
  const formData = new FormData();
  formData.append('file', { uri: imageUri, type: 'image/jpeg', name: `${refName}.jpg` });
  formData.append('title', refName);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Disposition': `attachment; filename="${refName}.jpg"`,
    },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(`Upload image échoué: ${data.message || response.status}`);
  }

  const data = await response.json();
  return data.id;
};

export const getCategoryId = async (categorySlug, categoryLabel, settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;

  const searchUrl = `${wooUrl}/wp-json/wc/v3/products/categories?slug=${categorySlug}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
  const searchResp = await fetch(searchUrl);
  if (searchResp.ok) {
    const cats = await searchResp.json();
    if (cats.length > 0) return cats[0].id;
  }

  const createUrl = `${wooUrl}/wp-json/wc/v3/products/categories?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
  const createResp = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: categoryLabel, slug: categorySlug }),
  });

  if (createResp.ok) {
    const cat = await createResp.json();
    return cat.id;
  }

  return null;
};

export const createProduct = async ({ refName, price, description, categorySlug, categoryLabel, imageId, settings }) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;

  const catId = await getCategoryId(categorySlug, categoryLabel, settings);

  const productData = {
    name: refName,
    type: 'simple',
    status: 'publish',
    regular_price: price.toString(),
    description: description || '',
    short_description: description || '',
    manage_stock: true,
    stock_quantity: 1,
    categories: catId ? [{ id: catId }] : [],
    images: imageId ? [{ id: imageId }] : [],
  };

  const url = `${wooUrl}/wp-json/wc/v3/products?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Erreur création produit: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id, permalink: data.permalink };
};

export const publishProduct = async ({ processedImageUri, refName, price, description, categorySlug, categoryLabel, settings, onProgress }) => {
  let imageId = null;

  if (settings.wpUsername && settings.wpAppPassword) {
    try {
      onProgress?.('📤 Upload de l\'image...');
      imageId = await uploadImage(processedImageUri, refName, settings);
      onProgress?.(`✅ Image uploadée (ID: ${imageId})`);
    } catch (e) {
      onProgress?.(`⚠️ Upload image échoué: ${e.message}`);
    }
  } else {
    onProgress?.('⚠️ Identifiants WordPress non configurés — produit sans image');
  }

  onProgress?.('📦 Création du produit...');
  const result = await createProduct({ refName, price, description, categorySlug, categoryLabel, imageId, settings });
  onProgress?.(`✅ Produit #${result.id} publié !`);
  return result;
};

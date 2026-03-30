// Version WEB de woocommerceService â upload via Blob au lieu de expo-file-system

export const testWooConnection = async (settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  if (!wooUrl || !consumerKey || !consumerSecret) throw new Error('ParamÃ¨tres WooCommerce manquants');

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
  const response = await fetch(`${wooUrl}/wp-json/wp/v2/users/me`, {
    method: 'GET',
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) throw new Error(`Authentification Ã©chouÃ©e (${response.status})`);
  const data = await response.json();
  return data.name || wpUsername;
};

// ââ Chargement des catÃ©gories rÃ©elles depuis WooCommerce ââââââââââââââââââââââ
// Retourne [{label, value (slug), id}] ou null si erreur
export const fetchCategories = async (settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  if (!wooUrl || !consumerKey || !consumerSecret) return null;
  try {
    const resp = await fetch(
      `${wooUrl}/wp-json/wc/v3/products/categories?per_page=100&orderby=name&order=asc&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`
    );
    if (!resp.ok) return null;
    const cats = await resp.json();
    return cats.map((c) => ({ label: c.name, value: c.slug, id: c.id }));
  } catch (e) {
    return null;
  }
};

export const uploadImage = async (imageUri, refName, settings) => {
  const { wooUrl, wpUsername, wpAppPassword } = settings;
  const credentials = btoa(`${wpUsername}:${wpAppPassword}`);

  // Sur web, imageUri est un data URL â on le convertit en Blob
  const fetchResponse = await fetch(imageUri);
  const blob = await fetchResponse.blob();

  const formData = new FormData();
  formData.append('file', blob, `${refName}.jpg`);
  formData.append('title', refName);

  const response = await fetch(`${wooUrl}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Disposition': `attachment; filename="${refName}.jpg"`,
    },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(`Upload image Ã©chouÃ©: ${data.message || response.status}`);
  }

  const data = await response.json();
  return data.id;
};

// ââ RÃ©solution de l'ID catÃ©gorie ââââââââââââââââââââââââââââââââââââââââââââââ
// Si categoryId est fourni directement (depuis fetchCategories), on l'utilise.
// Sinon : cherche par slug, puis par nom, puis crÃ©e en dernier recours.
export const getCategoryId = async (categorySlug, categoryLabel, settings, categoryId = null) => {
  if (categoryId) return categoryId;

  const { wooUrl, consumerKey, consumerSecret } = settings;
  const base = `${wooUrl}/wp-json/wc/v3/products/categories`;
  const auth = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

  // 1. Recherche par slug exact
  try {
    const slugResp = await fetch(`${base}?slug=${encodeURIComponent(categorySlug)}&${auth}`);
    if (slugResp.ok) {
      const cats = await slugResp.json();
      if (cats.length > 0) return cats[0].id;
    }
  } catch (_) {}

  // 2. Recherche par nom (Ã©vite les doublons si le slug diffÃ¨re)
  try {
    const nameResp = await fetch(`${base}?search=${encodeURIComponent(categoryLabel)}&${auth}`);
    if (nameResp.ok) {
      const cats = await nameResp.json();
      if (cats.length > 0) return cats[0].id;
    }
  } catch (_) {}

  // 3. CrÃ©ation uniquement si vraiment introuvable
  try {
    const createResp = await fetch(`${base}?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryLabel, slug: categorySlug }),
    });
    if (createResp.ok) {
      const cat = await createResp.json();
      return cat.id;
    }
  } catch (_) {}

  return null;
};

export const createProduct = async ({ refName, price, description, categorySlug, categoryLabel, categoryId, imageId, settings }) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  // Utilise l'ID direct si disponible (chargÃ© depuis l'API), sinon rÃ©solution par slug/nom
  const catId = await getCategoryId(categorySlug, categoryLabel, settings, categoryId);

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

  const response = await fetch(
    `${wooUrl}/wp-json/wc/v3/products?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Erreur crÃ©ation produit: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id, permalink: data.permalink };
};

export const publishProduct = async ({ processedImageUri, refName, price, description, categorySlug, categoryLabel, categoryId, settings, onProgress }) => {
  let imageId = null;

  if (settings.wpUsername && settings.wpAppPassword) {
    try {
      onProgress?.('ð¤ Upload de l\'image...');
      imageId = await uploadImage(processedImageUri, refName, settings);
      onProgress?.(`â Image uploadÃ©e (ID: ${imageId})`);
    } catch (e) {
      onProgress?.(`â ï¸ Upload image Ã©chouÃ©: ${e.message}`);
    }
  } else {
    onProgress?.('â ï¸ Identifiants WordPress non configurÃ©s â produit sans image');
  }

  onProgress?.('ð¦ CrÃ©ation du produit...');
  const result = await createProduct({ refName, price, description, categorySlug, categoryLabel, categoryId, imageId, settings });
  onProgress?.(`â Produit #${result.id} publiÃ© !`);
  return result;
};

// ââ Actions post-publication ââââââââââââââââââââââââââââââââââââââââââââââââââ

export const updateProductPrice = async (productId, newPrice, settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  const response = await fetch(
    `${wooUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regular_price: newPrice.toString() }),
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Erreur ${response.status}`);
  }
  return true;
};

export const unpublishProduct = async (productId, settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  const response = await fetch(
    `${wooUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Erreur ${response.status}`);
  }
  return true;
};

export const deleteProduct = async (productId, settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  const response = await fetch(
    `${wooUrl}/wp-json/wc/v3/products/${productId}?force=true&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Erreur ${response.status}`);
  }
  return true;
};

// ââ Liste des produits rÃ©cents âââââââââââââââââââââââââââââââââââââââââââââââââ
// Retourne les N derniers produits (publiÃ©s + brouillons)
export const fetchRecentProducts = async (settings, perPage = 30) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  if (!wooUrl || !consumerKey || !consumerSecret) return [];
  const resp = await fetch(
    `${wooUrl}/wp-json/wc/v3/products?per_page=${perPage}&orderby=date&order=desc&status=any&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`
  );
  if (!resp.ok) throw new Error(`Erreur ${resp.status}`);
  const products = await resp.json();
  return products.map((p) => ({
    id:        p.id,
    name:      p.name,
    price:     p.regular_price || p.price || '0',
    status:    p.status, // 'publish' | 'draft' | 'pending' ...
    thumbnail: p.images?.[0]?.src || null,
    permalink: p.permalink,
  }));
};

// ââ Republier un produit (draft â publish) âââââââââââââââââââââââââââââââââââââ
export const republishProduct = async (productId, settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  const response = await fetch(
    `${wooUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'publish' }),
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Erreur ${response.status}`);
  }
  return true;
};

export const searchProducts = async (query, settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const url = `${wooUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(query)}&per_page=20&status=any`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Erreur recherche: ${response.status}`);
  return await response.json();
};

export const setOutOfStock = async (productId, settings) => {
  const { wooUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const url = `${wooUrl}/wp-json/wc/v3/products/${productId}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_status: 'outofstock', manage_stock: true, stock_quantity: 0 }),
  });
  if (!response.ok) throw new Error(`Erreur rupture de stock: ${response.status}`);
  return await response.json();
};

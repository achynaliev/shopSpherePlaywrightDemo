// Request body for POST /api/cart — the server only accepts { productId, quantity }.
export const addToCartData = {
    productId: 8, // Brewmaster 12-Cup Programmable Coffee Maker
    quantity: 1
};

export const addToCartDataInvalid = {
    productId: 100, // not real product
    quantity: 1
};

export const addToCartDataOutOfStock = {
    productId: 7, // out of stock
    quantity: 1
};

// Stable fields expected on the product in the cart response (stock/rating change, so they're left out).
export const expectedCartProduct = {
    id: 8,
    slug: 'brewmaster-12-cup-programmable-coffee-maker',
    title: 'Brewmaster 12-Cup Programmable Coffee Maker',
    price: 6499
};

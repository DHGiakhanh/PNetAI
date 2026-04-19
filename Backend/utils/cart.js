const recalculateCartTotal = (cart) => {
    cart.totalAmount = cart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );
};

const removeMissingProductsFromCart = async (cart) => {
    if (!cart) {
        return cart;
    }

    const validItems = cart.items.filter((item) => Boolean(item.product));

    if (validItems.length === cart.items.length) {
        return cart;
    }

    cart.items = validItems;
    recalculateCartTotal(cart);
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate("items.product");

    return cart;
};

module.exports = {
    recalculateCartTotal,
    removeMissingProductsFromCart,
};

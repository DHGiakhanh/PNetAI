const STANDARD_SHIPPING_FEE_VND = 30000;
const EXPRESS_SHIPPING_FEE_VND = 100000;
const FREE_SHIPPING_THRESHOLD_VND = 500000;
const VALID_SHIPPING_METHODS = ["standard", "express"];

const normalizeShippingMethod = (value) => {
    if (typeof value !== "string") return "standard";
    const normalized = value.trim().toLowerCase();
    return VALID_SHIPPING_METHODS.includes(normalized) ? normalized : "standard";
};

const resolveProviderId = (input) => {
    if (!input) return null;

    let val = input;
    if (typeof input === "object" && "providerId" in input) {
        val = input.providerId;
    }

    if (!val) return null;

    if (typeof val === "string") {
        return val.trim();
    }

    if (typeof val === "object") {
        if (val._id) {
            return typeof val._id === "string" ? val._id.trim() : val._id.toString().trim();
        }
        if (typeof val.toString === "function") {
            const str = val.toString();
            if (str !== "[object Object]") {
                return str.trim();
            }
        }
    }

    return String(val).trim();
};

const calculateItemLineTotal = (price, quantity) => (
    Math.round(Number(price || 0)) * Number(quantity || 0)
);

const calculateShippingFee = (subtotalAmount, shippingMethod = "standard") => {
    const subtotal = Math.round(Number(subtotalAmount || 0));

    if (normalizeShippingMethod(shippingMethod) === "express") {
        return EXPRESS_SHIPPING_FEE_VND;
    }

    return subtotal >= FREE_SHIPPING_THRESHOLD_VND ? 0 : STANDARD_SHIPPING_FEE_VND;
};

const groupCartItemsByProvider = (items, shippingMethod = "standard") => {
    const providerMap = new Map();

    for (const item of items) {
        const providerId = resolveProviderId(item.product);
        if (!providerId) {
            return { error: `${item.product?.name || "Product"} is missing provider information` };
        }

        const existing = providerMap.get(providerId) || {
            provider: providerId,
            items: [],
            subtotalAmount: 0,
        };

        const orderItem = {
            product: item.product._id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
        };

        existing.items.push(orderItem);
        existing.subtotalAmount += calculateItemLineTotal(item.price, item.quantity);
        providerMap.set(providerId, existing);
    }

    const groups = Array.from(providerMap.values()).map((group) => {
        const shippingFee = calculateShippingFee(group.subtotalAmount, shippingMethod);
        return {
            ...group,
            subtotalAmount: Math.round(group.subtotalAmount),
            shippingFee,
            totalAmount: Math.round(group.subtotalAmount) + shippingFee,
        };
    });

    return { groups };
};

module.exports = {
    STANDARD_SHIPPING_FEE_VND,
    EXPRESS_SHIPPING_FEE_VND,
    FREE_SHIPPING_THRESHOLD_VND,
    VALID_SHIPPING_METHODS,
    normalizeShippingMethod,
    resolveProviderId,
    calculateItemLineTotal,
    calculateShippingFee,
    groupCartItemsByProvider,
};

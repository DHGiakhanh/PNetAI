const axios = require("axios");
const crypto = require("crypto");

const PAYOS_BASE_URL = process.env.PAYOS_BASE_URL || "https://api-merchant.payos.vn";

const sortObjDataByKey = (object) => {
    if (!object || typeof object !== "object" || Array.isArray(object)) {
        return object;
    }

    return Object.keys(object)
        .sort()
        .reduce((acc, key) => {
            const value = object[key];
            if (Array.isArray(value)) {
                acc[key] = value.map((item) => (item && typeof item === "object" ? sortObjDataByKey(item) : item));
                return acc;
            }

            acc[key] = value;
            return acc;
        }, {});
};

const convertObjToQueryStr = (object) => {
    return Object.keys(object)
        .filter((key) => object[key] !== undefined)
        .map((key) => {
            let value = object[key];

            if (Array.isArray(value)) {
                value = JSON.stringify(value.map((item) => (item && typeof item === "object" ? sortObjDataByKey(item) : item)));
            }

            if ([null, undefined, "undefined", "null"].includes(value)) {
                value = "";
            }

            return `${key}=${value}`;
        })
        .join("&");
};

const createHmacSha256 = (data, checksumKey) => {
    return crypto.createHmac("sha256", checksumKey).update(data).digest("hex");
};

const getPayOSHeaders = () => {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const partnerCode = process.env.PAYOS_PARTNER_CODE;

    if (!clientId || !apiKey) {
        throw new Error("Missing PAYOS_CLIENT_ID or PAYOS_API_KEY in environment variables");
    }

    return {
        "x-client-id": clientId,
        "x-api-key": apiKey,
        ...(partnerCode ? { "x-partner-code": partnerCode } : {}),
    };
};

const createPaymentRequestSignature = ({ amount, cancelUrl, description, orderCode, returnUrl }, checksumKey) => {
    if (!checksumKey) {
        throw new Error("Missing PAYOS_CHECKSUM_KEY in environment variables");
    }

    const data = sortObjDataByKey({ amount, cancelUrl, description, orderCode, returnUrl });
    const query = convertObjToQueryStr(data);
    return createHmacSha256(query, checksumKey);
};

const verifyWebhookSignature = (webhookData, signature, checksumKey) => {
    if (!checksumKey || !signature || !webhookData || typeof webhookData !== "object") {
        return false;
    }

    const sortedData = sortObjDataByKey(webhookData);
    const query = convertObjToQueryStr(sortedData);
    const generatedSignature = createHmacSha256(query, checksumKey);
    return generatedSignature.toLowerCase() === String(signature).toLowerCase();
};

const createPaymentLink = async (payload) => {
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    const signature = createPaymentRequestSignature(payload, checksumKey);

    const body = {
        ...payload,
        signature,
    };

    const response = await axios.post(`${PAYOS_BASE_URL}/v2/payment-requests`, body, {
        headers: {
            ...getPayOSHeaders(),
            "Content-Type": "application/json",
        },
    });

    return response.data;
};

const getPaymentLinkInfo = async (id) => {
    const response = await axios.get(`${PAYOS_BASE_URL}/v2/payment-requests/${id}`, {
        headers: getPayOSHeaders(),
    });

    return response.data;
};

const cancelPaymentLink = async (id, cancellationReason = "Cancelled by merchant") => {
    const response = await axios.post(
        `${PAYOS_BASE_URL}/v2/payment-requests/${id}/cancel`,
        { cancellationReason },
        {
            headers: {
                ...getPayOSHeaders(),
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

module.exports = {
    createPaymentLink,
    getPaymentLinkInfo,
    cancelPaymentLink,
    verifyWebhookSignature,
};

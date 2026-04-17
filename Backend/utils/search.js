const vietnameseCharMap = {
    a: "a\u00E0\u00E1\u1EA1\u1EA3\u00E3\u0103\u1EB1\u1EAF\u1EB7\u1EB3\u1EB5\u00E2\u1EA7\u1EA5\u1EAD\u1EA9\u1EAB",
    e: "e\u00E8\u00E9\u1EB9\u1EBB\u1EBD\u00EA\u1EC1\u1EBF\u1EC7\u1EC3\u1EC5",
    i: "i\u00EC\u00ED\u1ECB\u1EC9\u0129",
    o: "o\u00F2\u00F3\u1ECD\u1ECF\u00F5\u00F4\u1ED3\u1ED1\u1ED9\u1ED5\u1ED7\u01A1\u1EDD\u1EDB\u1EE3\u1EDF\u1EE1",
    u: "u\u00F9\u00FA\u1EE5\u1EE7\u0169\u01B0\u1EEB\u1EE9\u1EF1\u1EED\u1EEF",
    y: "y\u1EF3\u00FD\u1EF5\u1EF7\u1EF9",
    d: "d\u0111",
};

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeVietnameseChar(char) {
    if (!char) return "";
    if (char === "\u0111" || char === "\u0110") return "d";

    return char
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function buildVietnameseFlexibleRegex(value) {
    if (!value || !value.trim()) return null;

    const pattern = value
        .trim()
        .split("")
        .map((char) => {
            if (/\s/.test(char)) {
                return "[\\s_-]+";
            }

            const normalizedChar = normalizeVietnameseChar(char);
            const variants = vietnameseCharMap[normalizedChar];

            if (variants) {
                return `[${variants}]`;
            }

            return escapeRegex(char.toLowerCase());
        })
        .join("");

    if (!pattern) return null;
    return new RegExp(pattern, "i");
}

function buildTextSearchQuery(search, fields) {
    const regex = buildVietnameseFlexibleRegex(search);
    if (!regex) return null;

    return {
        $or: fields.map((field) => ({
            [field]: { $regex: regex },
        })),
    };
}

module.exports = {
    buildVietnameseFlexibleRegex,
    buildTextSearchQuery,
};

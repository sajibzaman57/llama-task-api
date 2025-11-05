function buildQueryParams(req) {
    const query = {};
    const options = {};

    if (req.query.where) {
        const parsedFilter = JSON.parse(req.query.where);
        Object.assign(query, { filter: parsedFilter }); // ✅ FIX: flatten into query
    }

    if (req.query.sort) options.sort = JSON.parse(req.query.sort);
    if (req.query.select) options.select = JSON.parse(req.query.select);
    if (req.query.skip) options.skip = parseInt(req.query.skip);
    if (req.query.limit) options.limit = parseInt(req.query.limit);
    if (req.query.count) options.count = req.query.count === 'true';

    return { query, options };
}

module.exports = buildQueryParams;
/**
* Distribute items among agents array (agentIds) evenly, sequentially for remainders
* items: array of objects
* agentIds: array of agent _id strings
* return: mapping agentId -> array of items
*/
function distributeItems(items, agentIds) {
    const result = {};
    agentIds.forEach(a => (result[a] = []));
    const n = items.length;
    const k = agentIds.length;
    const base = Math.floor(n / k);
    let remainder = n % k;
    let index = 0;
    for (let i = 0; i < k; i++) {
        const take = base + (remainder > 0 ? 1 : 0);
        remainder = Math.max(0, remainder - 1);
        for (let j = 0; j < take; j++) {
            if (index < n) {
                result[agentIds[i]].push(items[index++]);
            }
        }
    }
    return result;
}
module.exports = { distributeItems };
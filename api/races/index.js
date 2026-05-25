module.exports = async (req, res) => {
  try {
    const r = await fetch('https://www.dnd5eapi.co/api/races');
    const data = await r.json();
    res.setHeader('cache-control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

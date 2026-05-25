module.exports = async (req, res) => {
  try {
    const r = await fetch('https://api.open5e.com/v1/monsters/?document__slug=xge&limit=500');
    const data = await r.json();
    res.setHeader('cache-control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

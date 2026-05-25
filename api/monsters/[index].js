module.exports = async (req, res) => {
  try {
    const { index } = req.query;
    const r = await fetch(`https://www.dnd5eapi.co/api/monsters/${index}`);
    if (!r.ok) return res.status(r.status).send(await r.text());
    const data = await r.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

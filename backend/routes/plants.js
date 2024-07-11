const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant'); 

router.post('/initializePlants', async (req, res) => {
    const plants = req.body;
  
    try {
      for (const plant of plants) {
        await Plant.updateOne(
          { name: plant.name },
          { name: plant.name, views: 0 },
          { upsert: true }
        );
      }
      res.status(200).send({ message: 'Plants initialized successfully' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to initialize plants' });
    }
  });

router.put('/increment-views/:name', async (req, res) => {
    const { name } = req.params;
  
    try {
      const plant = await Plant.findOneAndUpdate(
        { name },
        { $inc: { views: 1 } },
        { new: true }
      );
  
      if (!plant) {
        return res.status(404).send({ error: 'Plant not found' });
      }
  
      res.status(200).send(plant);
    } catch (error) {
      res.status(500).send({ error: 'Failed to increment view count' });
    }
  });


  // 조회수가 큰 순으로 상위 5개의 식물 반환 엔드포인트
router.get('/topViews', async (req, res) => {
    try {
      const topPlants = await Plant.find()
        .sort({ views: -1 })
        .limit(6);
  
      res.status(200).send(topPlants);
    } catch (error) {
      res.status(500).send({ error: 'Failed to get top viewed plants' });
    }
  });

  module.exports = router;

import News from '../models/News.js';

// Create a news item
export const createNews = async (req, res) => {
  try {
    const { title, description, type } = req.body;

    const news = new News({ title, description, type });
    await news.save();

    res.status(201).json({ message: 'News created successfully!', news });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create news', error: error.message });
  }
};

// Get all news
export const getAllNews = async (req, res) => {
  try {
    const news = await News.find();
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch news', error: error.message });
  }
};

// Get single news item by ID
export const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch news', error: error.message });
  }
};

// Update news
export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;

    const news = await News.findByIdAndUpdate(
      id,
      { title, description, type },
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.status(200).json({ message: 'News updated successfully!', news });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update news', error: error.message });
  }
};

// Delete news
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findByIdAndDelete(id);

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.status(200).json({ message: 'News deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete news', error: error.message });
  }
};

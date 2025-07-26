const Category = require('../models/categoryModel');

exports.getAllCategories = async (req, res) => {
  const categories = await Category.getAll();
  res.json(categories);
};

exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  const category = await Category.getById(id);
  if (!category) return res.status(404).json({ msg: 'Category not found' });
  res.json(category);
};

exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.create(name, description);
  res.status(201).json(category);
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const updated = await Category.update(id, name, description);
  res.json(updated);
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  await Category.delete(id);
  res.json({ msg: 'Category deleted successfully' });
};

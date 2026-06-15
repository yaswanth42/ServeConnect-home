const Service = require('../models/Service');
const Category = require('../models/Category');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ==========================================
// CATEGORIES CONTROLLERS
// ==========================================

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: { categories }
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, icon } = req.body;
  const newCategory = await Category.create({ name, description, icon });
  res.status(201).json({
    status: 'success',
    data: { category: newCategory }
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return next(new AppError('No category found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { category }
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError('No category found with that ID', 404));
  }

  // Optional: Also delete or orphan services under this category
  await Service.deleteMany({ category: req.params.id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// ==========================================
// SERVICES CONTROLLERS
// ==========================================

exports.getAllServices = catchAsync(async (req, res, next) => {
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Construct MongoDB Query
  let queryStr = JSON.stringify(queryObj);
  // Support gte, gt, lte, lt
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  let query = Service.find(JSON.parse(queryStr)).populate('category');

  // 2) Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    });
  }

  // 3) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // default sort newest
  }

  // 4) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  // Execute query
  const services = await query;
  
  // Total count for pagination metadata
  let totalCountQuery = Service.find(JSON.parse(queryStr));
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    totalCountQuery = totalCountQuery.find({
      $or: [ { name: searchRegex }, { description: searchRegex } ]
    });
  }
  const totalServices = await totalCountQuery.countDocuments();

  res.status(200).json({
    status: 'success',
    results: services.length,
    total: totalServices,
    page,
    pages: Math.ceil(totalServices / limit),
    data: { services }
  });
});

exports.getService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id).populate('category');
  
  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }

  // Fetch related services in the same category
  const relatedServices = await Service.find({
    category: service.category._id,
    _id: { $ne: service._id }
  }).limit(3);

  res.status(200).json({
    status: 'success',
    data: {
      service,
      relatedServices
    }
  });
});

exports.createService = catchAsync(async (req, res, next) => {
  const newService = await Service.create(req.body);
  const populated = await Service.findById(newService._id).populate('category');
  
  res.status(201).json({
    status: 'success',
    data: { service: populated }
  });
});

exports.updateService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('category');

  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { service }
  });
});

exports.deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndDelete(req.params.id);

  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

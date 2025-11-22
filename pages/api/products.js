import {Product} from "@/models/Product";
import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import {deleteS3Objects} from "@/lib/s3";

export default async function handle(req, res) {
  const {method} = req;
  await mongooseConnect();
  await isAdminRequest(req,res);

  if (method === 'GET') {
    if (req.query?.id) {
      res.json(await Product.findOne({_id:req.query.id}));
    } else {
      // Поддръжка на пагинация, търсене и филтриране по статус
      const page = parseInt(req.query?.page) || 1;
      const limit = parseInt(req.query?.limit) || 30;
      const search = req.query?.search || '';
      const status = req.query?.status || '';
      const skip = (page - 1) * limit;

      // Създаваме query за търсене и статус
      let query = {};
      
      // Филтриране по статус
      if (status && (status === 'available' || status === 'borrowed')) {
        query.status = status;
      }
      
      // Търсене (комбинира се с филтъра за статус)
      if (search) {
        const searchQuery = {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
            { isbn: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ]
        };
        
        // Ако вече има филтър за статус, комбинираме ги
        if (query.status) {
          query = { $and: [query, searchQuery] };
        } else {
          query = searchQuery;
        }
      }

      // Броим общия брой резултати
      const totalCount = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);

      // Намираме продуктите с пагинация
      const products = await Product.find(query)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.json({
        products,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        }
      });
    }
  }

  if (method === 'POST') {
    const {title,description,author,isbn,publisher,publishedYear,images,category,properties,stock} = req.body;
    const productDoc = await Product.create({
      title,description,author,isbn,publisher,publishedYear,images,category,properties,stock,
    })
    res.json(productDoc);
  }

  if (method === 'PUT') {
    const {title,description,author,isbn,publisher,publishedYear,images,category,properties,_id,stock} = req.body;
    await Product.updateOne({_id}, {title,description,author,isbn,publisher,publishedYear,images,category,properties,stock});
    res.json(true);
  }

  if (method === 'DELETE') {
    if (req.query?.id) {
      const prod = await Product.findById(req.query.id);
      const images = Array.isArray(prod?.images) ? prod.images : [];
      await Product.deleteOne({_id:req.query.id});
      // Best-effort S3 cleanup
      await deleteS3Objects(images);
      res.json(true);
    }
  }
}
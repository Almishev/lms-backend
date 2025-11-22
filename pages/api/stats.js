import {mongooseConnect} from "@/lib/mongoose";
import {Product} from "@/models/Product";

export default async function handler(req,res) {
  await mongooseConnect();

  // Статистики за книги
  const totalBooks = await Product.countDocuments();
  const availableBooks = await Product.countDocuments({stock: {$gt: 0}});
  const unavailableBooks = await Product.countDocuments({stock: 0});

  res.json({
    books: {
      total: totalBooks,
      available: availableBooks,
      unavailable: unavailableBooks,
    }
  });
}



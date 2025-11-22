import {Product} from "@/models/Product";
import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";

export default async function handle(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({message: 'Method not allowed'});
    return;
  }

  await mongooseConnect();
  await isAdminRequest(req, res);

  try {
    const {bookId, userName, userEmail, userPhone} = req.body;

    if (!bookId || !userName) {
      res.status(400).json({message: 'bookId and userName are required'});
      return;
    }

    const book = await Product.findById(bookId);
    if (!book) {
      res.status(404).json({message: 'Book not found'});
      return;
    }

    if (book.stock <= 0) {
      res.status(400).json({message: 'Book is not available (stock is 0)'});
      return;
    }

    // Намаляваме quantity с 1
    const newStock = book.stock - 1;
    
    // Добавяме запис в borrowedBy
    const borrowedRecord = {
      userName,
      userEmail: userEmail || '',
      userPhone: userPhone || '',
      borrowedDate: new Date(),
    };

    const updateData = {
      stock: newStock,
      $push: { borrowedBy: borrowedRecord },
    };

    // Ако quantity === 0, сменяме status на "borrowed"
    if (newStock === 0) {
      updateData.status = 'borrowed';
    }

    await Product.updateOne({_id: bookId}, updateData);

    res.json({success: true, message: 'Book given successfully', stock: newStock});
  } catch (error) {
    console.error('Error giving book:', error);
    res.status(500).json({message: 'Internal server error'});
  }
}


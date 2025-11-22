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
    const {bookId, borrowedRecordIndex} = req.body;

    if (!bookId || borrowedRecordIndex === undefined) {
      res.status(400).json({message: 'bookId and borrowedRecordIndex are required'});
      return;
    }

    const book = await Product.findById(bookId);
    if (!book) {
      res.status(404).json({message: 'Book not found'});
      return;
    }

    if (!book.borrowedBy || !book.borrowedBy[borrowedRecordIndex]) {
      res.status(400).json({message: 'Borrowed record not found'});
      return;
    }

    const borrowedRecord = book.borrowedBy[borrowedRecordIndex];
    
    // Проверяваме дали вече е върната
    if (borrowedRecord.returnedDate) {
      res.status(400).json({message: 'Book is already returned'});
      return;
    }

    // Увеличаваме quantity с 1
    const newStock = book.stock + 1;

    // Обновяваме запис в borrowedBy с дата на връщане
    const updatedBorrowedBy = book.borrowedBy.map((record, index) => {
      if (index === borrowedRecordIndex) {
        return {
          ...record.toObject ? record.toObject() : record,
          returnedDate: new Date(),
        };
      }
      return record.toObject ? record.toObject() : record;
    });

    const updateData = {
      stock: newStock,
      borrowedBy: updatedBorrowedBy,
    };

    // Ако quantity > 0, сменяме status на "available"
    if (newStock > 0) {
      updateData.status = 'available';
    }

    await Product.updateOne({_id: bookId}, updateData);

    res.json({success: true, message: 'Book returned successfully', stock: newStock});
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({message: 'Internal server error'});
  }
}


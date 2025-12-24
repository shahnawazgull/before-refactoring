Prerequisites
Node.js (v14 or higher recommended)
MongoDB (local instance or MongoDB Atlas)
Installation

Clone the repository:
git clone git@github.com:shahnawazgull/before-refactoring.git
cd after-refactoring
Install dependencies:
npm install 
Create a public/images folder for uploads:
mkdir images
Set up your MongoDB connection in the main app file (e.g., server.js or via environment variables).
npm run dev
Open your browser and visit http://localhost:8080 (or your configured port).

Home page: Lists all products.
/add-product: Add a new product.
Edit/Delete: Available via links on product cards.
Notes

Image uploads are optional on edit.
Validation is basic (client-side preview + server-side Multer filters).
For production: Add proper authentication, error handling, and validation middleware.
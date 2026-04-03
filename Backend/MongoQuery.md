# MongoDB Commands with Examples

## 1. Insert Documents

- **Command**: `insertOne`, `insertMany`
- **Usage**:
  - Add a new document to the collection.
  - Add multiple documents to the collection at once.

```javascript
// Insert one document
db.collectionName.insertOne({ name: "John", age: 25, city: "New York" });

// Insert one document with a specified _id
db.collectionName.insertOne({ _id: 1, name: "John", age: 25, city: "New York" });

// Insert multiple documents with specified _id
db.collectionName.insertMany([
  { _id: 2, name: "Alice", age: 30, city: "Los Angeles" },
  { _id: 3, name: "Bob", age: 22, city: "Chicago" },
]);

// Insert multiple documents
db.collectionName.insertMany([
  { name: "Alice", age: 30, city: "Los Angeles" },
  { name: "Bob", age: 22, city: "Chicago" },
]);
```

## 2. Query Documents

- **Command**: `find`, `findOne`
- **Usage**:
  - Retrieve all documents that match the condition.
  - Retrieve the first document that matches the condition.

```javascript
// Find all documents where age is 25
db.collectionName.find({ age: 25 });

// Find all documents where age is greater than 20 and city is "New York"
db.collectionName.find({ age: { $gt: 20 }, city: "New York" });

// Find documents where name is "Alice" or age is 25
db.collectionName.find({
  $or: [{ name: "Alice" }, { age: 25 }]
});

// Find and get specific field
db.collectionName.find({}, { fullname: 1, _id: 0 });

// Find all documents and sort by age in descending order
db.collectionName.find().sort({ age: -1 });

// Find documents where age is either 25 or 30
db.collectionName.find({ age: { $in: [25, 30] } });

// Find the first 5 documents where age is 25
db.collectionName.find({ age: 25 }).limit(5);

// Find a document by its ID
db.collectionName.findById("60d5ec49b9a8f914c4e8a6b1");

// Find one document where name is "Alice"
db.collectionName.findOne({ name: "Alice" });

// Find one document where name is "Alice" and update the age, returning the original document
db.collectionName.findOneAndUpdate(
  { name: "Alice" },
  { $set: { age: 31 } },
  { returnDocument: "before" } // Options: "before" or "after"
);

// Find one document where name is "Alice" and delete it, returning the document
db.collectionName.findOneAndDelete({ name: "Alice" });

// Find one document where name is "Alice" and replace it with a new document, returning the new document
db.collectionName.findOneAndReplace(
  { name: "Alice" },
  { name: "Alice", age: 32, city: "San Francisco" },
  { returnDocument: "after" } // Options: "before" or "after"
);
```

## 3. Update Documents

- **Command**: `updateOne`, `updateMany`
- **Usage**:
  - Update the first document that matches the condition.
  - Update all documents that match the condition.

```javascript
// Update one document where name is "John"
db.collectionName.updateOne({ name: "John" }, { $set: { age: 26 } });

// Update all documents where city is "Chicago"
db.collectionName.updateMany(
  { city: "Chicago" },
  { $set: { city: "San Francisco" } }
);

// Replace one document where name is "John" with a new document
db.collectionName.replaceOne(
  { name: "John" },
  { name: "John", age: 27, city: "Miami" } // New document completely replaces the old one
);

// Find one document where name is "Alice" and update her age
const updatedDocument = db.collectionName.findOneAndUpdate(
  { name: "Alice" },
  { $set: { age: 30 } },
  { returnNewDocument: true } // Returns the updated document
);

// Find and update a document by its ID
const updatedById = db.collectionName.findByIdAndUpdate(
  "60d5ec49b9a8f914c4e8a6b1", // _id
  { $set: { city: "Los Angeles" } },
  { new: true } // Returns the updated document
);
```

## 4. Delete Documents

- **Command**: `deleteOne`, `deleteMany`
- **Usage**:
  - Delete the first document that matches the condition.
  - Delete all documents that match the condition.

```javascript
// Delete one document where name is "Alice"
db.collectionName.deleteOne({ name: "Alice" });

// Delete all documents where age is less than 25
db.collectionName.deleteMany({ age: { $lt: 25 } });

// Delete all documents in the collection
db.collectionName.deleteMany({});

// Delete document with a specific _id
db.collectionName.deleteOne({ _id: ObjectId("60d5ec49b9a8f914c4e8a6b1") });

// Delete all documents where name is "Bob" or age is greater than 30
db.collectionName.deleteMany({ $or: [{ name: "Bob" }, { age: { $gt: 30 } }] });

```

## 10. Populate

- **Command**: `populate`
- **Usage**: Combine data from different collections by linking documents via foreign keys.

```javascript
// Simple populate with one field
db.posts.find().populate('author');

// Get only name and email of the author during populate
db.posts.find().populate('author', 'name email');

// Populate only authors with 'active' status
db.posts.find().populate({
  path: 'author',
  match: { status: 'active' }
});

// Populate both 'author' and 'comments'
db.posts.find().populate('author').populate('comments');

// Populate 'author' and also populate 'profile' within it
db.posts.find().populate({
  path: 'author',
  populate: { path: 'profile' }
});

// Get only necessary fields from author
db.posts.find().populate({
  path: 'author',
  select: 'name email'
});

// Populate with a limit on comments
db.posts.find().populate({
  path: 'comments',
  options: { limit: 5 }
});


```

## 5. Counting Documents

- **Command**: `countDocuments`
- **Usage**: Count the number of documents that match the condition.

```javascript
// Count all documents where city is "New York"
db.collectionName.countDocuments({ city: "New York" });
```

## 6. Sorting Results

- **Command**: `sort`
- **Usage**: Sort documents based on a specific field.

```javascript
// Find all documents and sort by age in ascending order
db.collectionName.find().sort({ age: 1 });

// Sort by age in descending order
db.collectionName.find().sort({ age: -1 });

// Sort by age ascending, then by name descending if age is the same
db.collectionName.find().sort({ age: 1, name: -1 });

// Get top 5 oldest people
db.collectionName.find().sort({ age: -1 }).limit(5);

// Sort by name and retrieve only name and age fields
db.collectionName.find({}, { name: 1, age: 1 }).sort({ name: 1 });

// Sort by 'details.age' field within the 'profile' embedded document
db.collectionName.find().sort({ "profile.details.age": 1 });


```

## 7. Limiting and Skipping Results

- **Command**: `limit`, `skip`
- **Usage**: Limit the number of documents returned and skip a certain number.

```javascript
// Limit the result to 5 documents
db.collectionName.find().limit(5);

// Skip the first 3 documents and limit to 5
db.collectionName.find().skip(3).limit(5);

// Get the first document matching the condition
db.collectionName.find({ age: { $gt: 25 } }).limit(1);

// Get first 10 documents and return only 'name' and 'age' fields
db.collectionName.find({}, { name: 1, age: 1 }).limit(10);

// Get documents from a specific _id onwards, limiting results
const lastId = ObjectId("60f72f7c23b1b231d89abcde"); // Last _id of the previous page
db.collectionName.find({ _id: { $gt: lastId } }).limit(10);

```

## 8. Aggregation

- **Command**: `aggregate`
- **Usage**: Perform complex operations on documents (summarizing, counting, grouping).

```javascript
// Filter people aged over 25
db.collectionName.aggregate([{ $match: { age: { $gt: 25 } } }]);

// Group by city and calculate total sales
db.collectionName.aggregate([{ $group: { _id: "$city", totalSales: { $sum: "$amount" } } }]);

// Get only name and age after adding 5 years
db.collectionName.aggregate([{ $project: { name: 1, agePlusFive: { $add: ["$age", 5] } } }]);

// Sort documents by age descending
db.collectionName.aggregate([{ $sort: { age: -1 } }]);

// Get 10 documents after skipping 5
db.collectionName.aggregate([{ $skip: 5 }, { $limit: 10 }]);

// Perform join between 'orders' and 'customers' collections
db.orders.aggregate([
  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerInfo" } }
]);

// Deconstruct 'tags' array array into separate documents
db.collectionName.aggregate([{ $unwind: "$tags" }]);

// Add a new field calculating total cost (quantity * price)
db.collectionName.aggregate([{ $addFields: { totalCost: { $multiply: ["$quantity", "$price"] } } }]);

// Count people aged over 18
db.collectionName.aggregate([{ $match: { age: { $gt: 18 } } }, { $count: "adultCount" }]);

// Simultaneously count and calculate average age
db.collectionName.aggregate([
  {
    $facet: {
      totalAge: [{ $group: { _id: null, total: { $sum: "$age" } } }],
      averageAge: [{ $group: { _id: null, avg: { $avg: "$age" } } }]
    }
  }
]);



```

## 9. Comparison Operators in Queries 
    $gt: Greater than.
    $lt: Less than.
    $gte: Greater than or equal to.
    $lte: Less than or equal to.
    $ne: Not equal to.
    $in: Included in the list (in array).
    $nin: Not included in the list (not in array).
```javascript
    // Find all documents where age is greater than 30
    db.collectionName.find({ age: { $gt: 30 } });

    // Find all documents where age is less than 25
    db.collectionName.find({ age: { $lt: 25 } });

    // Find all documents where age is greater than or equal to 20
    db.collectionName.find({ age: { $gte: 20 } });

    // Find all documents where age is less than or equal to 40
    db.collectionName.find({ age: { $lte: 40 } });

    // Find all documents where city is not "Chicago"
    db.collectionName.find({ city: { $ne: "Chicago" } });

    // Find all documents where age is either 25 or 30
    db.collectionName.find({ age: { $in: [25, 30] } });

    // Find all documents where city is neither "New York" nor "San Francisco"
    db.collectionName.find({ city: { $nin: ["New York", "San Francisco"] } });
```

---

Notes:

- `collectionName` is the name of the collection you are operating on.
- `$set`, `$lt`, `$sum` are MongoDB operators.

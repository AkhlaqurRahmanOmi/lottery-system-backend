# GraphQL API Examples

This document contains various GraphQL query, mutation, and subscription examples for the Product API.

## Queries

### 1. Get All Products
```graphql
query GetAllProducts {
  products {
    id
    name
    description
    price
    category
    createdAt
    updatedAt
  }
}
```

### 2. Get Products with Filtering
```graphql
query GetFilteredProducts($category: String, $minPrice: Int, $maxPrice: Int, $search: String) {
  products(category: $category, minPrice: $minPrice, maxPrice: $maxPrice, search: $search) {
    id
    name
    price
    category
  }
}
```

**Variables:**
```json
{
  "category": "electronics",
  "minPrice": 500,
  "maxPrice": 2000,
  "search": "iPhone"
}
```

### 3. Get Single Product by ID
```graphql
query GetProduct($id: Int!) {
  product(id: $id) {
    id
    name
    description
    price
    category
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": 1
}
```

### 4. Search Products
```graphql
query SearchProducts($query: String!, $fields: [String!]) {
  searchProducts(query: $query, fields: $fields) {
    id
    name
    description
    price
    category
  }
}
```

**Variables:**
```json
{
  "query": "iPhone",
  "fields": ["name", "description"]
}
```

### 5. Get Products by Category
```graphql
query GetProductsByCategory($category: String!) {
  productsByCategory(category: $category) {
    id
    name
    price
    category
  }
}
```

**Variables:**
```json
{
  "category": "electronics"
}
```

### 6. Get Products by Price Range
```graphql
query GetProductsByPriceRange($minPrice: Int!, $maxPrice: Int!) {
  productsByPriceRange(minPrice: $minPrice, maxPrice: $maxPrice) {
    id
    name
    price
    category
  }
}
```

**Variables:**
```json
{
  "minPrice": 900,
  "maxPrice": 1200
}
```

### 7. Get All Categories
```graphql
query GetCategories {
  productCategories
}
```

### 8. Complex Query with Pagination and Sorting
```graphql
query GetProductsWithPagination(
  $page: Int, 
  $limit: Int, 
  $sortBy: String, 
  $sortOrder: String,
  $category: String,
  $search: String
) {
  products(
    page: $page, 
    limit: $limit, 
    sortBy: $sortBy, 
    sortOrder: $sortOrder,
    category: $category,
    search: $search
  ) {
    id
    name
    price
    category
    createdAt
  }
}
```

**Variables:**
```json
{
  "page": 1,
  "limit": 5,
  "sortBy": "price",
  "sortOrder": "desc",
  "category": "electronics",
  "search": "phone"
}
```

## Mutations

### 1. Create Product
```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(createProductInput: $input) {
    id
    name
    description
    price
    category
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "Samsung Galaxy S24",
    "description": "Latest Samsung flagship smartphone with AI features",
    "price": 899.99,
    "category": "electronics"
  }
}
```

### 2. Update Product
```graphql
mutation UpdateProduct($id: Int!, $input: UpdateProductInput!) {
  updateProduct(id: $id, updateProductInput: $input) {
    id
    name
    description
    price
    category
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": 1,
  "input": {
    "price": 1049.99,
    "description": "Updated iPhone with new features and improved camera"
  }
}
```

### 3. Delete Product
```graphql
mutation DeleteProduct($id: Int!) {
  deleteProduct(id: $id)
}
```

**Variables:**
```json
{
  "id": 3
}
```

## Subscriptions

### 1. Subscribe to Product Creation
```graphql
subscription ProductCreated($filter: ProductSubscriptionFilter) {
  productCreated(filter: $filter) {
    id
    name
    description
    price
    category
    createdAt
  }
}
```

**Variables (Optional Filtering):**
```json
{
  "filter": {
    "categories": ["electronics", "books"],
    "minPrice": 100,
    "maxPrice": 1000
  }
}
```

### 2. Subscribe to Product Updates
```graphql
subscription ProductUpdated($filter: ProductSubscriptionFilter) {
  productUpdated(filter: $filter) {
    id
    name
    description
    price
    category
    updatedAt
  }
}
```

**Variables (Optional Filtering):**
```json
{
  "filter": {
    "categories": ["electronics"],
    "minPrice": 500
  }
}
```

### 3. Subscribe to Product Deletion
```graphql
subscription ProductDeleted($filter: ProductSubscriptionFilter) {
  productDeleted(filter: $filter) {
    id
    name
    category
  }
}
```

**Variables (Optional Filtering):**
```json
{
  "filter": {
    "userId": "user123"
  }
}
```

## Advanced Examples

### 1. Comprehensive Product Query
```graphql
query ComprehensiveProductQuery {
  # Get all products
  allProducts: products {
    id
    name
    price
    category
  }
  
  # Get electronics only
  electronics: productsByCategory(category: "electronics") {
    id
    name
    price
  }
  
  # Get expensive products
  expensiveProducts: productsByPriceRange(minPrice: 1000, maxPrice: 5000) {
    id
    name
    price
  }
  
  # Get all categories
  categories: productCategories
  
  # Search for phones
  phoneProducts: searchProducts(query: "phone") {
    id
    name
    price
  }
}
```

### 2. Product Management Operations
```graphql
# First, create a product
mutation CreateAndUpdateProduct {
  # Create a new product
  newProduct: createProduct(createProductInput: {
    name: "MacBook Air M3"
    description: "Latest MacBook Air with M3 chip"
    price: 1299.99
    category: "electronics"
  }) {
    id
    name
    price
  }
}

# Then update it (use the returned ID)
mutation UpdateCreatedProduct($productId: Int!) {
  updatedProduct: updateProduct(
    id: $productId, 
    updateProductInput: {
      price: 1199.99
      description: "MacBook Air M3 - Now with special discount!"
    }
  ) {
    id
    name
    description
    price
    updatedAt
  }
}
```

## Testing with GraphQL Playground

1. Open your browser and go to: `http://localhost:3000/graphql`
2. You'll see the GraphQL Playground interface
3. Copy any of the above queries/mutations into the left panel
4. Add variables in the "Query Variables" section at the bottom left
5. Click the play button to execute
6. View results in the right panel

## Testing Subscriptions

For subscriptions, you'll need a WebSocket-capable GraphQL client. The GraphQL Playground supports subscriptions:

1. Open `http://localhost:3000/graphql`
2. Copy a subscription query
3. Click the play button
4. The subscription will remain active and show new events as they occur
5. In another tab/window, create/update/delete products to trigger subscription events

## Available Categories

The API supports these product categories:
- electronics
- clothing
- books
- home
- sports
- toys
- beauty
- automotive
- food
- health
- other
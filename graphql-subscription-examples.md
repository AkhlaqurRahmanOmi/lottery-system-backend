# GraphQL Subscription Examples

Since subscriptions require WebSocket connections, they can't be easily tested with PowerShell scripts. However, you can test them using the GraphQL Playground or other GraphQL clients.

## How to Test Subscriptions

### 1. Using GraphQL Playground

1. Open your browser and navigate to: `http://localhost:3000/graphql`
2. You'll see the GraphQL Playground interface
3. Open multiple tabs in the playground
4. In one tab, set up a subscription
5. In another tab, perform mutations to trigger the subscription

### 2. Example Subscription Tests

#### Test 1: Subscribe to Product Creation

**Tab 1 - Set up subscription:**
```graphql
subscription ProductCreated {
  productCreated {
    id
    name
    description
    price
    category
    createdAt
  }
}
```

**Tab 2 - Create a product to trigger the subscription:**
```graphql
mutation CreateProduct {
  createProduct(createProductInput: {
    name: "iPad Air M2"
    description: "Latest iPad Air with M2 chip"
    price: 599.99
    category: "electronics"
  }) {
    id
    name
    price
  }
}
```

#### Test 2: Subscribe to Product Updates with Filtering

**Tab 1 - Set up filtered subscription:**
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

**Variables for Tab 1:**
```json
{
  "filter": {
    "categories": ["electronics"],
    "minPrice": 500
  }
}
```

**Tab 2 - Update a product to trigger the subscription:**
```graphql
mutation UpdateProduct {
  updateProduct(id: 1, updateProductInput: {
    price: 899.99
    description: "iPhone 15 - Now with special discount!"
  }) {
    id
    name
    price
    updatedAt
  }
}
```

#### Test 3: Subscribe to Product Deletion

**Tab 1 - Set up subscription:**
```graphql
subscription ProductDeleted {
  productDeleted {
    id
    name
    category
  }
}
```

**Tab 2 - Delete a product to trigger the subscription:**
```graphql
mutation DeleteProduct {
  deleteProduct(id: 6)
}
```

### 3. Advanced Subscription Filtering

You can filter subscription events based on various criteria:

```graphql
subscription FilteredProductEvents($filter: ProductSubscriptionFilter) {
  productCreated(filter: $filter) {
    id
    name
    price
    category
  }
}
```

**Filter Variables:**
```json
{
  "filter": {
    "categories": ["electronics", "books"],
    "minPrice": 100,
    "maxPrice": 1000,
    "userId": "user123"
  }
}
```

### 4. Multiple Subscriptions

You can run multiple subscriptions simultaneously:

```graphql
subscription AllProductEvents($filter: ProductSubscriptionFilter) {
  productCreated(filter: $filter) {
    id
    name
    price
    category
    createdAt
  }
  productUpdated(filter: $filter) {
    id
    name
    price
    category
    updatedAt
  }
  productDeleted(filter: $filter) {
    id
    name
    category
  }
}
```

## Testing Workflow

1. **Start the server**: Make sure your NestJS server is running
2. **Open GraphQL Playground**: Navigate to `http://localhost:3000/graphql`
3. **Set up subscription**: In one tab, create a subscription query
4. **Click the play button**: The subscription will start listening
5. **Trigger events**: In another tab, perform mutations that will trigger the subscription
6. **Observe real-time updates**: The subscription tab will show new events as they occur

## Expected Behavior

- **Product Created**: When you create a new product, subscribers will receive the new product data
- **Product Updated**: When you update a product, subscribers will receive the updated product data
- **Product Deleted**: When you delete a product, subscribers will receive the deleted product information
- **Filtering**: Only events matching the filter criteria will be sent to subscribers

## Notes

- Subscriptions use WebSocket connections for real-time communication
- The server must support GraphQL subscriptions (which it does via Apollo Server)
- Filters are applied server-side to reduce unnecessary network traffic
- Multiple clients can subscribe to the same events simultaneously
- Subscriptions automatically reconnect if the connection is lost
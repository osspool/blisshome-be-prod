Hello Node js

api curl:

```
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Sample Product" \
  -F "description=This is a sample product." \
  -F "basePrice=99.99" \
  -F "quantity=50" \
  -F "category=60d21b4667d0d8992e610c85" \
  -F "variations=[{\"name\":\"Color\",\"options\":[{\"value\":\"Red\"},{\"value\":\"Blue\"}]}]" \
  -F "properties={\"material\":\"Cotton\"}" \
  -F "tags=featured,new" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.png"

```

Update product:

```
curl -X PUT http://localhost:5000/api/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Updated Product Name" \
  -F "removeImages[]=http://localhost:5000/images/products/unique-image1.jpg" \
  -F "removeImages[]=http://localhost:5000/images/products/unique-image2.jpg" \
  -F "images=@/path/to/new-image1.jpg" \
  -F "images=@/path/to/new-image2.png"

```

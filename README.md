# mealbro


**Assumptions**
1. Weeks run from Monday to Sunday based on the customer's timezone.
2. Money in cents
3. expects a unique key from driver app ,f or the delivery endpoint to be endpoint it needs cooperation from driver app . since driver can pay same money twice at same time the only possible thing to diffrenatite is a key from driver app
4. For now i expects one driver.ie, i dont added any driver specific fileds in db as of now


**Questions**
1. IS there any kind of Refund of payments


**With more time , I would:**
1. Right now , test case not added of limited time
2. Add  unit and integration tests.
3. OpenAPI/Swagger documentation.
4. Can add bulk seed data for easier local testing.
5. Add support for refunds and order cancellations if required.

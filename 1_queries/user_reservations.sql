SELECT reservations.id as reservation, properties.title as title, cost_per_night, start_date, AVG(rating) as average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN users ON users.id = guest_id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE users.email = 'tristanjacobs@gmail.com'
GROUP BY reservations.id, properties.title, cost_per_night
ORDER BY start_date DESC
LIMIT 10;
# Database Assessment

**Date:** Jun 11, 2025

**Subject:** Database Design and Queries Assessment

**Duration:** 2 weeks for Part I and 2 weeks for Part II

**Prerequisites:** You are all alone, but you are free to ask any member of the team

---

## Part I

We are a team of data engineers that we have been called by Region of Attica to design a database for collecting, storing & analyzing data about primary schools that belong to the specific region. Database design needs to be based on the following requirements:

1. Each primary school is defined with its name, the full name of each primary school director and the municipality that each primary school belongs to.
2. Each primary school occupies teachers, who are defined with information, such as the full name of each teacher, teacher's communication phone and the primary school that each teacher teaches.
3. Each primary school is consisted of students, who are registered with their full name, their father's name, their guardian's communication phone and the school department that they belong to.
4. Each primary school has its own classes. Each class for each primary school has its own departments.
5. Each primary school class contains a specific group of lessons. For each lesson the database should keep its name and the year of publication.
6. Each primary school keeps a specific weekly schedule, which includes information about the teacher, the school department he/she teaches, the school lesson he/she teaches, the week day and time slot he/she teaches the specific lesson and department.
7. Each primary school department has an absence book. For each absence book is necessary to keep the book keeper, the student that he/she made the absence, in which lesson and the date and time of the absence. Also, the absence should be indicated as justified or not, with a note.
8. For the school performance check we need to keep the year, the 3-months period, the student and his/her grade for each lesson from 1 to 10.

The assignment is to design the ERD diagram as of the above specifications and write the sql statements in order to create the database in MySQL.

### Glossary

- **Primary School:** A school for children between the ages of about six and twelve
- **Teacher:** Person who teaches young children from the ages of six to twelve
- **Student:** Person who studies at the primary school
- **Class:** A primary school is consisted of six classes and is six years of education
- **Department:** Each primary school class is divided into units, which depending on the school their number is from one to four or five
- **Lesson:** A fixed period of time when students are taught about a particular subject
- **Schedule:** All the different courses of study that are taught in a school, together with their timeframe
- **Absence Book:** Book in which students' non-attendance is registered

**Prerequisites:** Draw.io and MySQL Community Edition

---

## Part II

Answer each question by writing a single sql query. The result should contain both the answer and the sql query for each question.

**Prerequisites:** MySQL Community Edition with Sakila Sample Database.

1. Cities in Argentina
2. Number of Cities per Country
3. Actors last name, whose first name is MENA
4. Actors first and last name, whose last name starts with MO
5. Staffs email leaving in city Lethbridge
6. Addresses name (in district Andhra Pradesh with postal code 75474 or 40899) or in city Tarsus
7. Addresses name in district Alberta without a postal code
8. Addresses name in district Alberta without a postal code and without a phone number
9. Rentals datetime for the customers with id 459, 408, 549, 269, 37, 44, 535
10. Number of rentals that never returned to a store
11. Number of rentals returned the same day
12. Number of firms per rating
13. The rating with the maximum number of films
14. Films name and their rating with rental rate between 0 to 3 and length less or equal to 47
15. Number of films per month, rent to a customer by the staff member Mike Hillyer on 2005
16. Films title and actors full name of film's rating G or PG or PG-13 or R and film's special features contain 'deleted scenes' and actor's last name length is 6 or more characters
17. Films title and rental date and rental rate and replacement cost that are rented by inactive customers that live in the country "Virgin Islands, U.S."
18. Customer's full name with maximum number of rentals
19. Customer's full name with maximum amount of the total payments
20. Number of unique customers that returned a film in 5 days or more
21. Films title rent by customer with last name Williams
22. Total length of the unique films rent by customers whose first name start with G and the returned date happened on the first 6 months of 2005
23. Films title that actor's first name matches the customer's first name rent a film
24. Total number of rentals and total amount of rentals per store id, store city, film's category name for the whole year 2005 per month name
25. Store id and store city with the maximum amount of rentals for each film's category name for the whole year 2005 per month name

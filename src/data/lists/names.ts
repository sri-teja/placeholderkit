import type { Locale } from "../types";

// Space-separated to keep the bundle small. Varied within each locale.
const w = (s: string): string[] => s.trim().split(/\s+/);

export const FIRST_NAMES: Record<Locale, string[]> = {
  "en-US": w(`James Maria Ava Liam Noah Olivia Emma Sophia Mateo Lucas Mia Isabella Elijah Amara Harper Jayden Camila Diego
    Aaliyah Ethan Zoe Nora Kai Layla Malik Grace Daniel Hannah Andre Chloe Gabriel Aisha Leah Owen Priya Wei Mei Hiro Yuna
    Jin Ana Luis Sofia Carlos Valentina Jamal Imani Tyler Brooke Ryan Megan Kevin Lauren Marcus Jasmine Nathan Ruby Caleb
    Stella Aiden Naomi Julian Iris Miles Hazel Theo Ellie Omar Fatima Samuel Ruth Isaac Lila Xavier Elena Dante Maya Rosa
    Felix Quinn Riley Jordan Avery Morgan Taylor Cameron Parker Sage`),
  "en-GB": w(`Oliver George Arthur Noah Leo Harry Oscar Archie Henry Theo Freddie Alfie Charlie Jack Muhammad Olivia Amelia
    Isla Ava Ivy Freya Lily Florence Mia Willow Rosie Sophia Isabella Grace Evie Poppy Ella Harriet Imogen Alice Matilda
    Esme Elsie Daisy Phoebe Aria Zara Ayesha Hannah Priya Anjali Ravi Arjun Kiran Sanjay Tom Ben Sam Joe Dan Kate Lucy Emily
    Chloe Jess Sophie Ellie Callum Rhys Euan Fraser Iona Niamh Siobhan Cerys Dylan Owen Bethan Kwame Ama Kofi Tunde Yusuf
    Bilal Hamza Maryam Leah Nathan Finn Rory Jasmine Holly`),
  "en-IN": w(`Aarav Vivaan Aditya Vihaan Arjun Reyansh Sai Krishna Ishaan Rohan Kabir Aryan Dhruv Kunal Rahul Vikram Siddharth
    Karthik Pranav Nikhil Rajesh Suresh Anil Manoj Deepak Amit Varun Harsh Yash Ananya Diya Saanvi Aadhya Pari Anika Navya
    Myra Sara Kavya Priya Sneha Pooja Neha Divya Meera Lakshmi Anjali Riya Shreya Nisha Aishwarya Tanvi Isha Ritu Swati
    Kiran Arun Gaurav Farhan Imran Zoya Ayesha Sana Joseph Mary Anita Thomas Gurpreet Harpreet Simran Jaspreet Tenzing
    Aditi Bhavna Chitra Esha Gita Jyoti Lata Madhu Nandini Radha Rekha Sunita Uma Vidya`),
};

export const LAST_NAMES: Record<Locale, string[]> = {
  "en-US": w(`Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez Hernandez Lopez Gonzalez Wilson
    Anderson Thomas Taylor Moore Jackson Martin Lee Perez Thompson White Harris Sanchez Clark Ramirez Lewis Robinson Walker
    Young Allen King Wright Scott Torres Nguyen Hill Flores Green Adams Nelson Baker Hall Rivera Campbell Mitchell Carter
    Roberts Kim Patel Chen Wong Okafor Reyes Brooks Bennett Price Hughes Ortiz Kowalski Murphy Cohen Sullivan Russo Park
    Shah Diaz Ali Morales Foster Hayes Jensen`),
  "en-GB": w(`Smith Jones Taylor Brown Williams Wilson Johnson Davies Patel Robinson Wright Thompson Evans Walker White
    Roberts Green Hall Thomas Clarke Jackson Wood Harris Edwards Turner Martin Cooper Hill Ward Hughes Moore Clark King
    Harrison Lewis Baker Lee Allen Morris Khan Scott Watson Davis Parker James Bennett Young Phillips Richardson Mitchell
    Bailey Carter Cook Singh Shaw Bell Collins Morgan Kelly Begum Miller Cox Hussain Marshall Simpson Price Anderson Adams
    Ali Ahmed Foster Ellis Murphy Chapman Mason Gray Webb Griffiths Hunt Palmer Campbell Holmes Mills Rogers Barnes
    Knight Okoye Mensah Kaur`),
  "en-IN": w(`Sharma Verma Gupta Patel Shah Mehta Iyer Nair Menon Pillai Reddy Rao Naidu Kumar Singh Chauhan Yadav Mishra
    Pandey Tiwari Dubey Joshi Kulkarni Deshpande Patil Pawar Jadhav Desai Bhat Kamath Shetty Hegde Banerjee Chatterjee
    Mukherjee Das Ghosh Bose Sen Dutta Roy Chowdhury Saha Sinha Prasad Jha Thakur Agarwal Bansal Goel Jain Malhotra Kapoor
    Khanna Chopra Arora Bhatia Sethi Gill Sandhu Dhillon Grewal Khan Qureshi Siddiqui Ansari Fernandes D'Souza Pinto
    Rodrigues George Varghese Kurian Mathew Krishnan Subramanian Venkatesh Raman Natarajan Murthy`),
};

import psycopg2
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Connection details
host = os.getenv("DB_HOST")
port = os.getenv("DB_PORT")
database = os.getenv("DB_NAME")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")

# Establishing the connection
try:
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password
    )
    print("Successfully connected to the database.")
except psycopg2.Error as e:
    print(f"Error connecting to the database: {e}")
    exit(1)

# Creating a cursor object using the cursor() method
cur = conn.cursor()

try:
    with open('../guest_data.json', 'r') as f:
        data = json.load(f)
        group_names = data.get('group_names', [])
except FileNotFoundError:
    print("Error: 'guest_data.json' not found. Please make sure the file is in the same directory as the script.")
    group_names = []
except json.JSONDecodeError:
    print("Error: Could not decode JSON from 'guest_data.json'. Please check the file's format.")
    group_names = []

# Inserting the group names into the table
if group_names:
    for name in group_names:
        cur.execute("INSERT INTO groups (group_name) VALUES (%s)", (name,))

    # Commit the transaction
    conn.commit()
    print("Data insertion completed successfully.")
else:
    print("No group names found to insert. Please check 'guest_data.json'.")


# Closing the connection
cur.close()
conn.close()
print("Database connection closed.")
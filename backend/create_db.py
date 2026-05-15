import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    try:
        # Connect to the default 'postgres' database
        conn = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='root',
            host='localhost',
            port='5432'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if academics_db exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'academics_db'")
        exists = cur.fetchone()
        
        if not exists:
            print("Creating database 'academics_db'...")
            cur.execute('CREATE DATABASE academics_db')
            print("Database created successfully.")
        else:
            print("Database 'academics_db' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_database()

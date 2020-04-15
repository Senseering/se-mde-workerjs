# Creating complete test environment
 
  Update: You will need a dockerhub account that is logged in and part of Senseering Orga, to load the edgenode images. 
 `docker login` then your credentials and you can start with step 1. 
  
  ## 1. Installing packages [worker_js](https://github.com/Senseering/worker_js/ "Named link title") and [worker_test_js](https://github.com/Senseering/worker_test_js/ "Named link title")
     
     1.Install worker_js: 
        
        1.in worker_js : npm install
        2.in worker_js : sudo npm link (without sudo on windows)
     
     2.Install worker_test_js:
        
        1.in worker_test_js : npm install
        2.in worker_test_js : npm link ../worker_js

   ## 2. Start Edge-Node [edge_node_js](https://github.com/Senseering/edge_node_js/ "Named link title")

       1. cleanup (needed): 

           1.Kill all containers : docker container stop $(docker container ls -aq)
           2.delete all cache containers : docker system prune

       2. Build and Start:

          1.Build: `docker-compose build --no-cache`
          2.Start:  `docker-compose up`

  
  
  ## 3. API-KEY anf UUID for your test worker [API and UUID link](http://127.0.0.1:3001/worker/apikey/ "Named link title")
        
        1. copy this into your browser: `127.0.0.1:3001/worker/apikey` or click on link
           example site: {"uuid":"38e399af-2e38-5e22-a1f8-7b0db5345c2e","APIKey":"f92689a3f1b555d0be77b15633f5b386"}
        2. in worker_test_js/index.js update the "id" and the "apikey" with the values from the site
        

  ## 4. Send Test data:
  
         in the updated worker_test_js run:
         
         DEBUG=*,-follow-redirects node index.js
         or 
         npm run start (not working on windows)
         

 ## 5. Visualisation
     
   We have a MYSQL and a MONGODB where the MYSQL stores main data for searching
   (machine,timestamp..) MongoDB the whole Datatable created by the machine
     
   add your username and password in edge_node_js\conf\docker-entrypoint-initdb.d\1- usercreation.sql
     
   #### MYSQL-Database:
     
   Download [MYSQL Workbench](https://www.mysql.com/de/products/workbench/ "Named link title")    
     
   after the start only the Schema has to be added: "edgedb" port and IP are standard
    enter your username and password

   Query to get the data:
```sql
select * from edgedb.worker;
select * from edgedb.worker_input_output;
select * from edgedb.data;
select * from edgedb.worker_salt;
```
     
  # After finishing testing: do the "cleanup" from 2.(1.) again
  
   #### MongoDB:
Download [MongoDB-Compass](https://www.mongodb.com/download-center/compass?jmp=docs "Named link title")
     everything here should be automated
     
   ### Windows error:
    ERROR: for mongo Cannot start service application: driver failed programming external connectivity on endpoint edgenode_js (bd7f89ef4c1b0c6cbb4eb82ba552e5ccbf87f168ad81b8f8656bdc6443c2ef79): Error starting userland proxy: mkdir /port/tcp:0.0.0. 0:8888:tcp:172.18.0.4:8000: input/output error

    after docker-compose up, your Docker for windows is the problem. Nobody really knows why this is happening but restarting docker for windows does fix this issue.
    
   
    
    Another Error with Windows:
    MYSQL: [docker-compose]cannot start service (mysql): error while creating mount source path - permission denied 
    FIX: Go into Docker settings and give docker storage rights. 
    FIX2: if you use Docker as a Service Account: https://github.com/docker/for-win/issues/897 
    

   

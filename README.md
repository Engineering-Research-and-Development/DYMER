<img src="https://github.com/Engineering-Research-and-Development/DYMER/screenshots/Dymer.jpg" title="Dymer" alt="Dymer"> 

# DYMER

> DYnamic Information ModElling & Rendering

The DYMER is a suite for resource catalog visualization. DYMER provides advanced mapping capabilities between a data model in JSON format and its graphic template on the one hand, and on the other hand, it provides a JavaScript framework for integrating the DYMER template into a web-based application. The software is flexible because it adopts open technologies and can be used in various environments without considerable requirements. 

## Table of contents
* [**Architecture**](#architecture)
* [**Technologies**](#technologies)
* [**Features**](#features)
* [**Requirements**](#requirements)
* [**Setup**](#setup)
* [**How to use**](#how-to-use)
* [**Important Notes**](#important-notes)
* [**Troubleshoot**](#troubleshoot)
* [**Contributors**](#contributors)
* [**Status**](#status)
* [**Licence**](#licence)


## Architecture

The DYMER consists of two main components:  

* DYMER-Core
* DYMER-Viewer  

**DYMER-Core** is based on a microservice architectural style with an approach to develop a single application as a suite of small services, each running in its own process and communicating with lightweight mechanisms using HTTP/REST protocols alongside JSON.  

The diagram in Figure depicts the building block components: 
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/DymerArchitecture.png)]

Each microservice is developed with a specific role, however among the main ones we can identify three that have the most impact on DEH:  

- Templates microservice is responsible for generating graphic templates that can be used in order to display products and services using logic-less templates.  

- Forms microservice is responsible for modeling data and metadata inherent to the products and services offered in DEH.  

- Entities microservice is responsible for managing the storage and usage of the product and its services. 

These microservice are developed with Express.js framework for Node.js, designed for building web applications and APIs, released as free and open-source software under the MIT License. 

The information is stored in NoSQL Database that provides high performance, high availability, and automatic scaling. Service-Entities use Elasticsearch that is a distributed, open-source search and analytics engine for all types of data, including textual, numerical, geospatial, structured, and unstructured that stores data in JSON format.  

Interaction with the **DYMER-Core** takes place through the **DYMER-Viewer** which is a fast, small, and feature-rich JavaScript library. Thanks to it, it is possible to interact with the platform facilitating the user in the use of data by offering a single search point and displaying the results in special graphic templates.  
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/render-list.png)]
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/render-list-detail.png)]
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/html_map.jpg)]
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/html_map_table.jpg.jpg)]
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/html_mapdetail.jpg)]
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/example_formrender.png)]
The user will also be able to perform a search among the resources in the list, using a special search function. The search will obviously be gradually refined in the implementation, in its technical details and as a web module by adding the necessary filters that will become necessary from time to time. Next Figure shows how a user can access the search filters :  
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/render-list-filtersnippets.png)]
The DYMER also implements administration functionality represented by a web-based application, to allow a user with Admin role to have complete management of Templates, Models or Forms and Entities. The next Figure shows the administration dashboard of DYMER component:
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/ws-dashboard.png)]

By clicking on the Templates link menu, on the left in the drop-down list, the user can access to the list of the currently registered Templates, in order to view them or create new templates through Manage Template  functionality or modify the existing ones. 
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/ws-template-editor.png)]
The same management features are available respectively for the models/forms 
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/ws-model-editor.png)]
[![](https://github.com/Engineering-Research-and-Development/DYMER/screenshots/ws-manageEntity.png)]


## Technologies

| Description                                     | Language    | Version          |
| :---------------------------------------------- | :---------: | :--------------: |
| [Node.js][1]                                    | JavaScript  | 10.13.0          |
| [Express][2]                                    | JavaScript  | 4.16.4           |
| [Docker][3]                                     |             | 19.03.8          |
| [AngularJS][4]                                  | JavaScript  | 1.7.9            |
| [JQuery][5]                                     |             | 3.3              |
| [Bootstrap][6]                                  |             | 3/4              |
| [Handlebars][7]                                 |             |                  |
| [MongoDB][8]                                    |             | 3.6.9            |
| [ElasticSearch][9]                              |             | 6.5.1            |



[1]:  https://nodejs.org/en/
[2]:  https://expressjs.com/en/4x/api.html
[3]:  https://docs.docker.com/get-docker/
[4]:  https://angularjs.org/
[5]:  https://jquery.com/
[6]:  https://getbootstrap.com/
[7]:  https://handlebarsjs.com/
[8]:  https://www.mongodb.com/try/download/community
[9]:  https://www.elastic.co/downloads/past-releases/elasticsearch-6-5-1


## Features

* Dynamic modeling of data and metadata inherent to the products and services offered
* Generation of Graphics Templates that can be used in the display of products and services using logic-less templates
* Managing the storage and use of the product and services.
* Displaying and searching all types of data, including textual, numerical, geospatial, structured, and unstructured data. 



## Requirements

* Installed Docker (version >= 18) 
* Installed Docker Compose


## Setup

After pulling the source code, open terminal, and go to the root folder and follow the next steps:

* _Change_ `HOST_PORT` _in_ `.env` _if you want to run DYMER on a specific port. Default value is_ `HOST_PORT=8888`. 
* _Run_ `docker-compose up` _in order to start DYMER services._
* _If you want to run containers in the background run the next command_ `docker-compose up -d`



## How to use

After containers are up and running, you can access to DYMER admin panel at the next URL: `http://localhost:[HOST_PORT]`

Default user credentials:

* username: **_admin_**
* password: **_dymer_**

To use DYMER on the client-side and render Graphic templates, Dymer.viewer library should be included in the client application with proper configuration.



#### _Example of configuration:_  

```javascript
<script>
    var jsonDymerConfig = {
        query: { // define the query to do in dymer
            "instance": {
                "index": index-entity  
                "type":  type-entity  
            }
        },
        endpoint: 'entity.search', // set the endpoint to execute the query of entities
        viewtype: 'teaserlist', // set to use the 'Preview in List' template
        target: {
            teaserlist: { // configure where and how to render the preview of entities
                    id: "#cont-MyList", // the entities will be render inside the element with id "#cont-MyList"
                    action: "html", // set the method to insert the content (html/append/prepend)
                    reload: false // if false the query will be executed only on page load 
            },
            fullcontent: {// configure where and how to render the detail of an entity
                id: "#cont-MyList", // the entity will be rendered inside the element with id "#cont-MyList"
                action: "html" // set the method to insert the content (html/append/prepend)
            }
        }
    };
    function mainDymerView() {
        drawEntities(jsonDymerConfig);
    }
 </script>
```
<script id="dymerurl" src="<dymerip>/public/cdn/js/dymer.viewer.js"> </script>
 <div id="cont-MyList"></div>



## Important Notes

The application image doesn't contain any data, so for the use of DYMER features, first you need to create Template, Model, and Entity.


## Troubleshoot
**TO DO**


## Contributors


* [Marco Bernandino Romano](https://github.com/marco-romano-eng) 
* [Marko Stojanovic](https://github.com/marest94) 


## Status
Project is: _in progress_ 


## License
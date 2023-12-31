const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initialiseDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at 3000!!!");
    });
  } catch (e) {
    console.log(`Server error ${e.message}`);
    process.exit(1);
  }
};

initialiseDbandServer();

//get method
const convertcase = (dbobj) => {
  return {
    stateId: dbobj.state_id,
    stateName: dbobj.state_name,
    population: dbobj.population,
  };
};

app.get("/states/", async (request, response) => {
  const listofstatesquery = `SELECT * FROM state;`;
  const res1 = await db.all(listofstatesquery);
  response.send(res1.map((eachstate) => convertcase(eachstate)));
});

//get method1
const convertcase1 = (dbobj1) => {
  let r = {
    stateId: dbobj1.state_id,
    stateName: dbobj1.state_name,
    population: dbobj1.population,
  };
  return r;
};

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const statesquery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const res2 = await db.all(statesquery);
  response.send(...res2.map((eachstate1) => convertcase1(eachstate1)));
});

//post method
app.post("/districts/", async (request, response) => {
  const districtdetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtdetails;

  const insertquery = `INSERT INTO district (district_name, state_id, cases, cured, active , deaths) 
  VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const res3 = await db.run(insertquery);
  response.send("District Successfully Added");
});

//get method in district table
const convertcase2 = (dbobj2) => {
  let r1 = {
    districtId: dbobj2.district_id,
    districtName: dbobj2.district_name,
    stateId: dbobj2.state_id,
    cases: dbobj2.cases,
    cured: dbobj2.cured,
    active: dbobj2.active,
    deaths: dbobj2.deaths,
  };
  return r1;
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtsquery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const res4 = await db.all(districtsquery);
  response.send(...res4.map((eachdistrict1) => convertcase2(eachdistrict1)));
});

//delete method

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletequery = `DELETE FROM district WHERE district_id = ${districtId};`;
  const res5 = await db.run(deletequery);
  response.send("District Removed");
});

//update district table
app.put("/districts/:districtId/", async (request, response) => {
  const districtdetails1 = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtdetails1;

  const updatequery = `UPDATE district SET 
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases}, 
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE district_id = ${districtId};`;
  const res6 = await db.run(updatequery);
  response.send("District Details Updated");
});

//get method

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statisticquery = `
  SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
  FROM district 
    WHERE state_id = ${stateId};`;
  const stats = await db.get(statisticquery);
  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//get method
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT state_id FROM district
      WHERE district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
SELECT state_name AS stateName FROM state
WHERE state_id = ${getDistrictIdQueryResponse.state_id};`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;

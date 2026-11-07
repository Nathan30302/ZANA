-- Only these nodes are visited. Places become city and neighbourhood labels.
node_keys = { "place" }

function init_function()
end

function exit_function()
end

local function road_class(highway)
  if highway == "motorway" or highway == "motorway_link" then return "motorway" end
  if highway == "trunk" or highway == "trunk_link" then return "trunk" end
  if highway == "primary" or highway == "primary_link" then return "primary" end
  if highway == "secondary" or highway == "secondary_link" then return "secondary" end
  if highway == "tertiary" or highway == "tertiary_link" then return "tertiary" end
  if highway == "residential" or highway == "living_street" or highway == "unclassified" then return "residential" end
  if highway == "service" then return "service" end
  if highway == "path" or highway == "footway" or highway == "cycleway" or highway == "track" or highway == "pedestrian" or highway == "steps" then
    return "path"
  end
  return "other"
end

local function road_minzoom(class)
  if class == "motorway" or class == "trunk" then return 6 end
  if class == "primary" then return 8 end
  if class == "secondary" then return 10 end
  if class == "tertiary" then return 12 end
  if class == "residential" or class == "other" then return 13 end
  return 14
end

local function land_class(way)
  local landuse = way:Find("landuse")
  if landuse ~= "" then return landuse end
  local leisure = way:Find("leisure")
  if leisure == "park" or leisure == "garden" or leisure == "pitch" or leisure == "playground" then
    return leisure
  end
  local natural = way:Find("natural")
  if natural == "wood" or natural == "grassland" or natural == "scrub" or natural == "wetland" then
    return natural
  end
  return ""
end

function node_function(node)
  local place = node:Find("place")
  if place == "" then return end
  local z = 14
  if place == "city" then z = 5
  elseif place == "town" then z = 8
  elseif place == "suburb" or place == "village" then z = 11
  elseif place == "neighbourhood" or place == "quarter" then z = 13
  else return end
  node:Layer("place", false)
  node:MinZoom(z)
  node:Attribute("class", place)
  node:Attribute("name", node:Find("name"))
end

function way_function(way)
  local highway = way:Find("highway")
  if highway ~= "" and highway ~= "proposed" and highway ~= "construction" and highway ~= "platform" then
    local class = road_class(highway)
    local z = road_minzoom(class)
    way:Layer("transportation", false)
    way:MinZoom(z)
    way:Attribute("class", class)
    local name = way:Find("name")
    if name ~= "" then
      way:Layer("transportation_name", false)
      way:MinZoom(math.max(z, 13))
      way:Attribute("class", class)
      way:Attribute("name", name)
    end
  end

  -- Tilemaker already sends multipolygon buildings through way_function,
  -- so a compound mapped as one relation stays one footprint.
  local building = way:Find("building")
  if building ~= "" and building ~= "no" and building ~= "demolished" and building ~= "proposed" and building ~= "razed" then
    way:Layer("building", true)
    way:MinZoom(14)
    local name = way:Find("name")
    if name ~= "" then way:Attribute("name", name) end
  end

  local natural = way:Find("natural")
  local water = way:Find("water")
  local waterway = way:Find("waterway")
  if natural == "water" or natural == "bay" or water ~= "" or waterway == "riverbank" or way:Find("landuse") == "reservoir" then
    way:Layer("water", true)
    way:MinZoom(6)
  elseif waterway == "river" or waterway == "canal" or waterway == "stream" or waterway == "ditch" then
    way:Layer("waterway", false)
    way:MinZoom(waterway == "stream" and 13 or 9)
    way:Attribute("class", waterway)
  end

  local class = land_class(way)
  if class ~= "" then
    way:Layer("landuse", true)
    local z = 12
    if class == "forest" or class == "wood" or class == "farmland" or class == "grassland" then z = 8
    elseif class == "residential" then z = 11 end
    way:MinZoom(z)
    way:Attribute("class", class)
  end
end

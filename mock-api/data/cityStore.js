let cities = []

export function listCities() {
  return cities
}

export function findCityById(id) {
  return cities.find((city) => city.id === id)
}

export function createCity(city) {
  cities.push(city)
  return city
}

export function updateCity(id, patch) {
  const city = findCityById(id)
  if (!city) return undefined
  Object.assign(city, patch)
  return city
}

export function deleteCity(id) {
  const index = cities.findIndex((city) => city.id === id)
  if (index === -1) return undefined
  const [deleted] = cities.splice(index, 1)
  return deleted
}

export function resetCities() {
  cities = []
  return cities
}

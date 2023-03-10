import * as data from "../data.js"
import { Query } from "../model/query.js";

export function validateQuery(query: Query): boolean {
  if (data.saleTypes.find(x => x == query.saleType) == undefined) {
    return false;
  }
  if (data.propertyTypes.find(x => x == query.propertyType) == undefined) {
    return false;
  }
  if (data.districts.find(x => x.value == query.district) == undefined) {
    return false;
  }
  return true;
}
import { Regions } from "../constants/index.js"

const regionUsers = {}
for (const region of Regions) {
    regionUsers[region] = 0
}

export function getRegionUsers(){
    return regionUsers
}

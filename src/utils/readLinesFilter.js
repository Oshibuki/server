import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const ban_list = "src/server-api/servers/ban_list.txt"
const fileStream = createReadStream(ban_list);
const rl = createInterface({
  input: fileStream,
  crlfDelay: Infinity
});
export default async function(filter){
    let result=[]
    for await (const line of rl) {
        if(!line.includes(filter)) result.push(line)
    }
    return result
}

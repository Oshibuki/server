import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const ban_list = process.env.WBMM_BAN_LIST
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

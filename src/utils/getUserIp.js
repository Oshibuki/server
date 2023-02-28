import { getClientIp } from 'request-ip';

export default function(req) {
    const clientIp = getClientIp(req); 
    return clientIp
};

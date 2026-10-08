import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {isAdmin} from '@/lib/registry';
import Registry from '../registry';
export const dynamic='force-dynamic';
export default async function Admin(){await requireChatGPTUser('/admin');if(!await isAdmin())return <main className="shell"><h1>Owner access only</h1><p>Sign in with Caroline’s account to manage this list.</p><a href="/">Back to the list</a></main>;return <Registry management/>;}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CardInfo {
  name: string;
  type: 'character' | 'pet';
  image: string;
  faction: string;
}

// Simplified card database (основные карты из каждой фракции)
const cardDatabase: CardInfo[] = [
  // Kaledor Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/27831c0a-e7a0-4ac4-84d9-642b6fa0e31c.png', faction: 'Каледор' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/6f418524-f8c0-444e-aac7-dc60d548275a.png', faction: 'Каледор' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/2e357adf-59ac-4ebc-8f34-fb77d085801d.png', faction: 'Каледор' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/5aa39f4e-18e2-4514-b338-2871069ebde3.png', faction: 'Каледор' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/e2726d02-61d0-49f8-88cd-5eb5d7412563.png', faction: 'Каледор' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/c9a16f25-86df-4d19-8e29-6e9784d21cc0.png', faction: 'Каледор' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/7472b221-f5e0-4f77-8fce-96b9cd408d98.png', faction: 'Каледор' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/27f02bff-5707-40b9-a94e-77669bd08bde.png', faction: 'Каледор' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/6f852396-ab0a-42af-8b0b-a19fad23fe91.png', faction: 'Каледор' },
  
  // Kaledor Dragons
  { name: 'Обычный ледяной дракон', type: 'pet', image: '/lovable-uploads/a684a167-5ab8-4c2c-916e-c1e2b2c7a335.png', faction: 'Каледор' },
  { name: 'Необычный ледяной дракон', type: 'pet', image: '/lovable-uploads/dec21ec3-c2d5-41c0-bb9b-991822a2e180.png', faction: 'Каледор' },
  { name: 'Редкий ледяной дракон', type: 'pet', image: '/lovable-uploads/6e94c9a2-5307-4802-8e31-dc179c870b4b.png', faction: 'Каледор' },
  { name: 'Эпический ледяной дракон', type: 'pet', image: '/lovable-uploads/ce617343-8823-428c-b91d-8f847977046a.png', faction: 'Каледор' },
  { name: 'Легендарный ледяной дракон', type: 'pet', image: '/lovable-uploads/1c428823-cebc-41ea-a9c0-6f741e5ae1ae.png', faction: 'Каледор' },
  { name: 'Мифический ледяной дракон', type: 'pet', image: '/lovable-uploads/3eab57b0-ee8f-4abf-bedc-fb4ae9384d33.png', faction: 'Каледор' },
  { name: 'Этернал ледяной дракон', type: 'pet', image: '/lovable-uploads/d9fed790-128c-40f2-b174-66bff52f9028.png', faction: 'Каледор' },
  { name: 'Империал ледяной дракон', type: 'pet', image: '/lovable-uploads/9f15a393-34df-4a04-9fc8-31b2aa858458.png', faction: 'Каледор' },
  { name: 'Титан ледяной дракон', type: 'pet', image: '/lovable-uploads/372deb79-915d-44a2-ab23-ef5e9e85252d.png', faction: 'Каледор' },
  
  // Sylvanesti Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/1f4e533a-06b4-4168-8645-92c4dfcc0f83.png', faction: 'Сильванести' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/204989a1-fd9e-46a4-bb1f-7a37c2003992.png', faction: 'Сильванести' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/8315d200-d3f6-4f47-a192-ae3b8bbe256c.png', faction: 'Сильванести' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/352e8041-3c0d-47b6-a1a0-17fdcc215e39.png', faction: 'Сильванести' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/51123039-7d7c-4e6e-af8a-fe4af77daeae.png', faction: 'Сильванести' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/f4d36e40-0f18-44c6-be2f-00485663b1f4.png', faction: 'Сильванести' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/9d1badd7-dc8d-483f-ab61-cad6de839eda.png', faction: 'Сильванести' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/1935aa54-a23e-4c99-84bf-dff3404feb2d.png', faction: 'Сильванести' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/981732c0-c6c4-41bf-9eff-e1dc31c3e000.png', faction: 'Сильванести' },
  
  // Sylvanesti Dragons  
  { name: 'Обычный песчаный дракон', type: 'pet', image: '/lovable-uploads/d812fbd1-74f7-4cad-83c1-c009ba0f77b5.png', faction: 'Сильванести' },
  { name: 'Необычный песчаный дракон', type: 'pet', image: '/lovable-uploads/a6d08592-67c9-42b0-8625-4713b997376f.png', faction: 'Сильванести' },
  { name: 'Редкий песчаный дракон', type: 'pet', image: '/lovable-uploads/0686d153-7d4f-4946-9212-f1ba3ebbca32.png', faction: 'Сильванести' },
  { name: 'Эпический песчаный дракон', type: 'pet', image: '/lovable-uploads/bccd3f95-c340-4678-bacf-5a589f379683.png', faction: 'Сильванести' },
  { name: 'Легендарный песчаный дракон', type: 'pet', image: '/lovable-uploads/64ceab84-8336-40e0-9219-31f4e51ea217.png', faction: 'Сильванести' },
  { name: 'Мифический песчаный дракон', type: 'pet', image: '/lovable-uploads/9876a84c-a134-4d64-b0fa-064fb1dd6f5f.png', faction: 'Сильванести' },
  { name: 'Этернал песчаный дракон', type: 'pet', image: '/lovable-uploads/3db3c69b-58d8-467c-a075-a0adc7ac1fa4.png', faction: 'Сильванести' },
  { name: 'Империал песчаный дракон', type: 'pet', image: '/lovable-uploads/2c707ae0-ddf1-426e-95ae-509431a7cf65.png', faction: 'Сильванести' },
  { name: 'Титан песчаный дракон', type: 'pet', image: '/lovable-uploads/aa7ab873-cb54-4825-a3f9-95d935df9b5d.png', faction: 'Сильванести' },
  
  // Faelin Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/5fed4049-637c-47a4-a2b1-3f1c9151ce6a.png', faction: 'Фаэлин' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/a2bf6e6b-c3ad-4919-812d-26f61b1660d4.png', faction: 'Фаэлин' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/4de24dee-aa59-49c8-a22e-77f9172110c0.png', faction: 'Фаэлин' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/1ea2379e-5c9b-40ce-bbd1-d8a667459a6e.png', faction: 'Фаэлин' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/7d20bcae-86a0-404c-a63e-0a40cab478ea.png', faction: 'Фаэлин' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/beb0976f-7d76-4165-ba28-ac63df8ac3ed.png', faction: 'Фаэлин' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/412adee5-aa9d-4f82-aef6-010e7396639e.png', faction: 'Фаэлин' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/c6a95c40-c402-46b6-b21a-0051de7364bd.png', faction: 'Фаэлин' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/3070cb69-0e5b-4302-bb5a-58fca3176ad8.png', faction: 'Фаэлин' },
  
  // Faelin Dragons
  { name: 'Обычный водный дракон', type: 'pet', image: '/lovable-uploads/ad27c2c4-b16c-4acd-804e-3f8e5d3cd854.png', faction: 'Фаэлин' },
  { name: 'Необычный водный дракон', type: 'pet', image: '/lovable-uploads/b460c0ff-11e9-42f3-9513-449548603837.png', faction: 'Фаэлин' },
  { name: 'Редкий водный дракон', type: 'pet', image: '/lovable-uploads/062fe717-3d1f-4352-b4a9-08e0b4d5725c.png', faction: 'Фаэлин' },
  { name: 'Эпический водный дракон', type: 'pet', image: '/lovable-uploads/f97dbde4-585c-4a9d-b47a-32fe1cf9392f.png', faction: 'Фаэлин' },
  { name: 'Легендарный водный дракон', type: 'pet', image: '/lovable-uploads/20deedc6-2a07-448e-85c1-04c7f76eac4d.png', faction: 'Фаэлин' },
  { name: 'Мифический водный дракон', type: 'pet', image: '/lovable-uploads/3d06ad8d-92f6-484b-8546-e0ef65e11a8a.png', faction: 'Фаэлин' },
  { name: 'Этернал водный дракон', type: 'pet', image: '/lovable-uploads/caf6b106-e3b0-4bfa-a0a5-33dc2788b459.png', faction: 'Фаэлин' },
  { name: 'Империал водный дракон', type: 'pet', image: '/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png', faction: 'Фаэлин' },
  { name: 'Титан водный дракон', type: 'pet', image: '/lovable-uploads/b11af136-e52a-47d2-8cb0-4b6e268ff771.png', faction: 'Фаэлин' },
  
  // Ellenar Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/1ef80899-e4c6-4721-8a05-de94e0c343dc.png', faction: 'Элленар' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/4c023e71-6d34-4e86-b1a3-9f78ba68b271.png', faction: 'Элленар' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/8dd620ce-c00a-4c42-97bf-c10a0aabdef4.png', faction: 'Элленар' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/2e4cba48-e157-417d-9e50-df04a49583c1.png', faction: 'Элленар' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/24850ede-c373-48b8-850b-519991a60829.png', faction: 'Элленар' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/f40bd001-d7bb-4095-9c90-9bf654618564.png', faction: 'Элленар' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/7e48953b-db9f-4c0e-8e8c-b76c055cd4c3.png', faction: 'Элленар' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/3d3c8ebd-a4a2-4ad4-a623-866f1bb0287b.png', faction: 'Элленар' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/f32f0976-8067-4774-a02d-776393efc5e5.png', faction: 'Элленар' },
  
  // Ellenar Dragons
  { name: 'Обычный светлый дракон', type: 'pet', image: '/lovable-uploads/4e90788f-f14d-4972-b8e1-b89bf85bc890.png', faction: 'Элленар' },
  { name: 'Необычный светлый дракон', type: 'pet', image: '/lovable-uploads/7fb8c699-793a-44b4-a2d3-88f652d02df0.png', faction: 'Элленар' },
  { name: 'Редкий светлый дракон', type: 'pet', image: '/lovable-uploads/2e6a0e07-5212-42e8-8b87-f121469fcc0e.png', faction: 'Элленар' },
  { name: 'Эпический светлый дракон', type: 'pet', image: '/lovable-uploads/09258293-d0bc-46b5-a0aa-d606cc9d860a.png', faction: 'Элленар' },
  { name: 'Легендарный светлый дракон', type: 'pet', image: '/lovable-uploads/6ba29742-0bdb-477e-924e-c97d968909f4.png', faction: 'Элленар' },
  { name: 'Мифический светлый дракон', type: 'pet', image: '/lovable-uploads/2e0dbff7-125d-4e5e-9402-73de3eeba9a1.png', faction: 'Элленар' },
  { name: 'Этернал светлый дракон', type: 'pet', image: '/lovable-uploads/c38ed092-c0bd-4f34-9b21-35ab70d00e91.png', faction: 'Элленар' },
  { name: 'Империал светлый дракон', type: 'pet', image: '/lovable-uploads/09caa6d5-c3fe-490f-9c3f-f7a4e43d4542.png', faction: 'Элленар' },
  { name: 'Титан светлый дракон', type: 'pet', image: '/lovable-uploads/d0cfd02f-9c08-4ece-a326-fd76f6f915f9.png', faction: 'Элленар' },
  
  // Telerion Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/9278c174-0cbd-4e3e-ae12-3d267733ff2c.png', faction: 'Тэлэрион' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/bb1c95ac-b19a-41d3-ab68-528e33af9303.png', faction: 'Тэлэрион' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/c12f7db9-7813-49e4-ad83-e8f0e436c186.png', faction: 'Тэлэрион' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/51ce0d6f-97a6-4671-a6a6-637eb77f4302.png', faction: 'Тэлэрион' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/09f804c7-86f3-4eca-b205-393e34503dc0.png', faction: 'Тэлэрион' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/ee677202-cd81-453c-a240-08902e95e832.png', faction: 'Тэлэрион' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/3fb5fc61-5d0b-40e0-851b-1c4d5d8ec899.png', faction: 'Тэлэрион' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/f8bedbc8-2486-4af6-9de0-8c2d2536564e.png', faction: 'Тэлэрион' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/157ea897-e1c6-408f-944a-8463c3ec1424.png', faction: 'Тэлэрион' },
  
  // Telerion Dragons
  { name: 'Обычный теневой дракон', type: 'pet', image: '/lovable-uploads/8a7f1faf-6eb6-4516-9a43-88db6cc83016.png', faction: 'Тэлэрион' },
  { name: 'Необычный теневой дракон', type: 'pet', image: '/lovable-uploads/755cdb02-5979-4591-9cf1-d9b72af904df.png', faction: 'Тэлэрион' },
  { name: 'Редкий теневой дракон', type: 'pet', image: '/lovable-uploads/fa290afb-f4ef-445f-b1e1-65ecf8b90bc2.png', faction: 'Тэлэрион' },
  { name: 'Эпический теневой дракон', type: 'pet', image: '/lovable-uploads/c1ade134-8b22-40f8-a928-a1e07f4f0395.png', faction: 'Тэлэрион' },
  { name: 'Легендарный теневой дракон', type: 'pet', image: '/lovable-uploads/14e70f3f-fbe9-4d39-bbe7-707940e520b3.png', faction: 'Тэлэрион' },
  { name: 'Мифический теневой дракон', type: 'pet', image: '/lovable-uploads/937ab950-dfce-4271-aeea-64516080f84f.png', faction: 'Тэлэрион' },
  { name: 'Этернал теневой дракон', type: 'pet', image: '/lovable-uploads/50e7d6a4-063e-4d5d-859b-87a1eedd4e5e.png', faction: 'Тэлэрион' },
  { name: 'Империал теневой дракон', type: 'pet', image: '/lovable-uploads/7cbb0d6f-8c9e-4ec2-9e47-1942e3d6750c.png', faction: 'Тэлэрион' },
  { name: 'Титан теневой дракон', type: 'pet', image: '/lovable-uploads/7358b58a-6645-4d85-ac12-696fdf68e2f7.png', faction: 'Тэлэрион' },
  
  // Aelantir Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/195033f3-1c3d-461f-88ca-243f19a1a2b2.png', faction: 'Аэлантир' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/6dbe88ca-2da9-4836-8514-42d42fc6c0e2.png', faction: 'Аэлантир' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/6b92a8a2-f7dd-4f8d-80d6-9c75092bdce0.png', faction: 'Аэлантир' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/5b432b9a-123d-427b-a8f9-be62971556eb.png', faction: 'Аэлантир' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/072e712e-b51a-43a5-beca-6b2b4cc57bab.png', faction: 'Аэлантир' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/efb78739-7cb3-4c04-ae4d-06207d311fe2.png', faction: 'Аэлантир' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/7c1d642a-f411-4ef9-90ac-624e03528a57.png', faction: 'Аэлантир' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/a8941e22-eb71-41da-b79d-697ec40c19fc.png', faction: 'Аэлантир' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/ec76b547-e84b-479c-8301-966e46bd410f.png', faction: 'Аэлантир' },
  
  // Aelantir Dragons
  { name: 'Обычный земной дракон', type: 'pet', image: '/lovable-uploads/c7fb83f7-8fd4-460f-a46e-afdcda1ebf5f.png', faction: 'Аэлантир' },
  { name: 'Необычный земной дракон', type: 'pet', image: '/lovable-uploads/a67b0362-c82a-4564-99e8-8776f6bf6591.png', faction: 'Аэлантир' },
  { name: 'Редкий земной дракон', type: 'pet', image: '/lovable-uploads/83540e14-d8ed-424d-9244-694381bdbddf.png', faction: 'Аэлантир' },
  { name: 'Эпический земной дракон', type: 'pet', image: '/lovable-uploads/36e1d451-fecc-4db6-ae8b-42c341c78f27.png', faction: 'Аэлантир' },
  { name: 'Легендарный земной дракон', type: 'pet', image: '/lovable-uploads/d983aa63-95f4-4409-8d62-e92b853c851b.png', faction: 'Аэлантир' },
  { name: 'Мифический земной дракон', type: 'pet', image: '/lovable-uploads/1c898dd5-a044-49f9-be5b-782331a277db.png', faction: 'Аэлантир' },
  { name: 'Этернал земной дракон', type: 'pet', image: '/lovable-uploads/0ebba56d-d197-40d9-818a-070d54268140.png', faction: 'Аэлантир' },
  { name: 'Империал земной дракон', type: 'pet', image: '/lovable-uploads/ce3292f0-e4aa-4a42-a73a-753b3887a621.png', faction: 'Аэлантир' },
  { name: 'Титан земной дракон', type: 'pet', image: '/lovable-uploads/deabe14b-dfed-4776-a35b-2c533979952c.png', faction: 'Аэлантир' },
  
  // Lioras Heroes
  { name: 'Рекрут', type: 'character', image: '/lovable-uploads/7ab893a1-5053-46ee-b7ae-3ec02eaf27cc.png', faction: 'Лиорас' },
  { name: 'Страж', type: 'character', image: '/lovable-uploads/8bdbdb12-8542-4b48-9e94-56381e6b83c5.png', faction: 'Лиорас' },
  { name: 'Ветеран', type: 'character', image: '/lovable-uploads/7029b0b3-2bcd-49c6-8c97-848605f6adff.png', faction: 'Лиорас' },
  { name: 'Маг', type: 'character', image: '/lovable-uploads/5b20f6f0-2fe4-4fd1-8b44-9e2f6d1e9fe2.png', faction: 'Лиорас' },
  { name: 'Мастер Целитель', type: 'character', image: '/lovable-uploads/39f90b07-6e7b-47b0-aa55-0e9098ced929.png', faction: 'Лиорас' },
  { name: 'Защитник', type: 'character', image: '/lovable-uploads/eb79ec90-c640-466c-adc7-c09833724b82.png', faction: 'Лиорас' },
  { name: 'Ветеран Защитник', type: 'character', image: '/lovable-uploads/c3dbc9c7-1b63-4522-bf24-bef8245f51f8.png', faction: 'Лиорас' },
  { name: 'Стратег', type: 'character', image: '/lovable-uploads/d7df42e6-cf06-4aa0-8e61-6f1cd5fd6f7a.png', faction: 'Лиорас' },
  { name: 'Верховный Стратег', type: 'character', image: '/lovable-uploads/5cd82d92-0700-4a7b-ac18-db694d3e0e95.png', faction: 'Лиорас' },
  
  // Lioras Dragons
  { name: 'Обычный лесной дракон', type: 'pet', image: '/lovable-uploads/d081d1db-aab3-4a95-b5a3-569454011d36.png', faction: 'Лиорас' },
  { name: 'Необычный лесной дракон', type: 'pet', image: '/lovable-uploads/7d753ea0-0d79-490a-aea7-bfa1c207c1af.png', faction: 'Лиорас' },
  { name: 'Редкий лесной дракон', type: 'pet', image: '/lovable-uploads/65dc676f-631e-4c33-ab62-54640607c321.png', faction: 'Лиорас' },
  { name: 'Эпический лесной дракон', type: 'pet', image: '/lovable-uploads/ee5368e1-44c7-43d4-be3b-b8114fe275d8.png', faction: 'Лиорас' },
  { name: 'Легендарный лесной дракон', type: 'pet', image: '/lovable-uploads/45f1daa1-fe0a-4415-966d-97180027eb93.png', faction: 'Лиорас' },
  { name: 'Мифический лесной дракон', type: 'pet', image: '/lovable-uploads/954afd3f-3148-4e1f-9d99-223655cc522e.png', faction: 'Лиорас' },
  { name: 'Этернал лесной дракон', type: 'pet', image: '/lovable-uploads/20f876ac-c5a5-48c5-8d7c-a4cbcb5e3af7.png', faction: 'Лиорас' },
  { name: 'Империал лесной дракон', type: 'pet', image: '/lovable-uploads/282ffbe2-827c-409d-b018-1d5ef3e51376.png', faction: 'Лиорас' },
  { name: 'Титан лесной дракон', type: 'pet', image: '/lovable-uploads/a8780075-c97a-42ae-a5b9-da3863dc754e.png', faction: 'Лиорас' },
];

type ClassLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type HeroClass = 
  | 'Рекрут'
  | 'Страж'
  | 'Ветеран'
  | 'Маг'
  | 'Мастер Целитель'
  | 'Защитник'
  | 'Ветеран Защитник'
  | 'Стратег'
  | 'Верховный Стратег';

type DragonClass = 
  | 'Обычный'
  | 'Необычный'
  | 'Редкий'
  | 'Эпический'
  | 'Легендарный'
  | 'Мифический'
  | 'Этернал'
  | 'Империал'
  | 'Титан';

// Function to pick a random class level based on weighted probabilities
function pickClassLevel(): ClassLevel {
  const roll = Math.random() * 100;
  
  let classLevel: ClassLevel;
  let range: string;
  
  if (roll <= 80.00) {
    classLevel = 1;
    range = "0.01-80.00 (80%)";
  } else if (roll <= 90.00) {
    classLevel = 2;
    range = "80.01-90.00 (20%)";
  } else if (roll <= 95.00) {
    classLevel = 3;
    range = "90.01-95.00 (15%)";
  } else if (roll <= 98.00) {
    classLevel = 4;
    range = "95.01-98.00 (10%)";
  } else if (roll <= 99.00) {
    classLevel = 5;
    range = "98.01-99.00 (5%)";
  } else if (roll <= 99.70) {
    classLevel = 6;
    range = "99.01-99.70 (3%)";
  } else if (roll <= 99.90) {
    classLevel = 7;
    range = "99.71-99.90 (2%)";
  } else if (roll <= 99.99) {
    classLevel = 8;
    range = "99.91-99.99 (1%)";
  } else {
    classLevel = 9;
    range = "99.991-100.00 (0.5%)";
  }
  
  console.log(`🎲 Class Level Roll: ${roll.toFixed(4)} → Level ${classLevel} (${range})`);
  
  return classLevel;
}

// Convert class level to actual class name based on card type
function getCardClass(level: ClassLevel, cardType: 'character' | 'pet'): HeroClass | DragonClass {
  if (cardType === 'character') {
    const heroClasses: HeroClass[] = [
      'Рекрут',
      'Страж',
      'Ветеран',
      'Маг',
      'Мастер Целитель',
      'Защитник',
      'Ветеран Защитник',
      'Стратег',
      'Верховный Стратег'
    ];
    return heroClasses[level - 1];
  } else {
    const dragonClasses: DragonClass[] = [
      'Обычный',
      'Необычный',
      'Редкий',
      'Эпический',
      'Легендарный',
      'Мифический',
      'Этернал',
      'Империал',
      'Титан'
    ];
    return dragonClasses[level - 1];
  }
}

function getMagicResistanceByFaction(faction: string): number | undefined {
  const resistances: Record<string, number> = {
    'Каледор': 10,
    'Сильванести': 15,
    'Фаэлин': 20,
    'Элленар': 5,
    'Тэлэрион': 25,
    'Аэлантир': 30,
    'Лиорас': 12,
    'Тень': 35
  };
  return resistances[faction];
}

function generateCard() {
  const typeRoll = Math.floor(Math.random() * 2) + 1;
  const cardType = typeRoll === 1 ? 'character' : 'pet';
  console.log(`🎲 Type Roll: ${typeRoll} → ${cardType === 'character' ? 'Герой' : 'Дракон'}`);
  
  // Pick class level (instead of rarity)
  const classLevel = pickClassLevel();
  const cardClass = getCardClass(classLevel, cardType);
  console.log(`🎖️ Card Class: ${cardClass} (level ${classLevel})`);
  
  // Determine available factions for this type + class
  const availableFactions = Array.from(
    new Set(
      cardDatabase
        .filter((c) =>
          c.type === cardType &&
          (cardType === 'character' ? c.name === cardClass : c.name.startsWith(cardClass))
        )
        .map((c) => c.faction)
    )
  ).filter(Boolean) as string[];
  
  const selectedFaction = availableFactions.length
    ? availableFactions[Math.floor(Math.random() * availableFactions.length)]
    : (Array.from(new Set(cardDatabase.filter((c) => c.type === cardType).map((c) => c.faction))).filter(Boolean)[0] as string | undefined);
  
  console.log(`🏳️ Selected faction for this roll: ${selectedFaction || 'none'}`);
  
  // Filter cards by type, class and faction to ensure consistency with the grimoire
  let matchingCards: CardInfo[];
  if (cardType === 'character') {
    matchingCards = cardDatabase.filter(
      (card) => card.type === 'character' && card.name === cardClass && card.faction === selectedFaction
    );
  } else {
    matchingCards = cardDatabase.filter(
      (card) => card.type === 'pet' && card.name.startsWith(cardClass) && card.faction === selectedFaction
    );
  }
  
  // Fallbacks
  if (matchingCards.length === 0) {
    console.warn(`⚠️ No cards for type=${cardType}, class=${cardClass}, faction=${selectedFaction}. Falling back to class-only.`);
    matchingCards = cardDatabase.filter((card) =>
      card.type === cardType && (cardType === 'character' ? card.name === cardClass : card.name.startsWith(cardClass))
    );
  }
  if (matchingCards.length === 0) {
    console.error(`❌ No cards for type=${cardType}, class=${cardClass}. Falling back to type-only.`);
    matchingCards = cardDatabase.filter((card) => card.type === cardType);
  }
  
  const selectedCard = matchingCards[Math.floor(Math.random() * matchingCards.length)];
  const magicResistance = getMagicResistanceByFaction(selectedCard.faction);
  
  const card = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: selectedCard.name,
    type: cardType,
    rarity: 1, // Always 1 star now
    cardClass,
    classLevel,
    faction: selectedCard.faction,
    magicResistance,
    image: selectedCard.image,
    // Stats будут рассчитаны на клиенте через calculateCardStats с учетом classLevel
  };
  
  console.log(`✨ Generated Card: ${selectedCard.name} (${cardType}) 1⭐ Class: ${cardClass} (level ${classLevel}) faction=${selectedCard.faction} image=${selectedCard.image}`);
  
  return card;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address, pack_name, count } = await req.json();
    
    console.log(`🎁 EDGE FUNCTION v2.0: Opening ${count} card pack(s) for wallet ${wallet_address}`);
    
    if (!wallet_address || !pack_name || !count || count < 1) {
      throw new Error('Invalid parameters');
    }

    // Generate cards with detailed logging
    const newCards = [];
    for (let i = 0; i < count; i++) {
      console.log(`\n📦 Generating card ${i + 1}/${count}:`);
      const card = generateCard();
      newCards.push(card);
    }
    
    console.log(`\n✅ Generated ${newCards.length} cards total`);
    console.log('Summary:', newCards.map(c => `${c.name} 1⭐ ${c.cardClass}`).join(', '));

    // Call RPC to atomically update inventory and add cards
    const supabaseUrl = 'https://oimhwdymghkwxznjarkv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.rpc('open_card_packs', {
      p_wallet_address: wallet_address,
      p_pack_name: pack_name,
      p_count: count,
      p_new_cards: newCards
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    console.log('✅ Database updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        cards: newCards,
        count: newCards.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in open-card-packs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

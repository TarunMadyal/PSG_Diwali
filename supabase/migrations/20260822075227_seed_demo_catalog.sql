insert into public.categories(slug,name_en,name_kn,image_path,sort_order) values
('mens-night-pants','Men''s night pants','ಪುರುಷರ ನೈಟ್ ಪ್ಯಾಂಟ್','/demo/category-1.svg',10),
('night-tshirts','Night T-shirts','ನೈಟ್ ಟಿ-ಶರ್ಟ್','/demo/category-2.svg',20),
('half-collar','Half-collar shirts','ಅರ್ಧ ತೋಳಿನ ಕಾಲರ್ ಶರ್ಟ್','/demo/category-3.svg',30),
('full-collar','Full-collar shirts','ಉದ್ದ ತೋಳಿನ ಕಾಲರ್ ಶರ್ಟ್','/demo/category-4.svg',40),
('womens-nightwear','Women''s nightwear','ಮಹಿಳೆಯರ ನೈಟ್ ವೇರ್','/demo/category-5.svg',50),
('kids-festive','Kids festive wear','ಮಕ್ಕಳ ಹಬ್ಬದ ಉಡುಪು','/demo/category-6.svg',60),
('dhotis','Dhotis','ಪಂಚೆಗಳು','/demo/category-1.svg',70),
('leggings','Leggings','ಲೆಗ್ಗಿಂಗ್ಸ್','/demo/category-5.svg',80),
('innerwear','Innerwear','ಒಳ ಉಡುಪು','/demo/category-2.svg',90)
on conflict(slug) do nothing;

insert into public.products(category_id,name_en,name_kn,price_paise,image_path,sort_order)
select c.id,p.name_en,p.name_kn,p.price_paise,p.image_path,p.sort_order
from (values
 ('mens-night-pants','Cotton comfort pants','ಕಾಟನ್ ಕಂಫರ್ಟ್ ಪ್ಯಾಂಟ್',39900,'/demo/product-1.svg',10),
 ('night-tshirts','Soft night T-shirt','ಮೃದುವಾದ ನೈಟ್ ಟಿ-ಶರ್ಟ್',34900,'/demo/product-2.svg',10),
 ('half-collar','Classic half-collar shirt','ಕ್ಲಾಸಿಕ್ ಅರ್ಧ ಕಾಲರ್ ಶರ್ಟ್',59900,'/demo/product-3.svg',10),
 ('full-collar','Festival full-collar shirt','ಹಬ್ಬದ ಉದ್ದ ಕಾಲರ್ ಶರ್ಟ್',74900,'/demo/product-4.svg',10),
 ('womens-nightwear','Floral cotton nightwear','ಹೂವಿನ ಕಾಟನ್ ನೈಟ್ ವೇರ್',54900,'/demo/product-5.svg',10),
 ('kids-festive','Kids celebration set','ಮಕ್ಕಳ ಹಬ್ಬದ ಸೆಟ್',69900,'/demo/product-6.svg',10),
 ('dhotis','Traditional cotton dhoti','ಸಾಂಪ್ರದಾಯಿಕ ಕಾಟನ್ ಪಂಚೆ',44900,'/demo/product-1.svg',10),
 ('leggings','Everyday stretch leggings','ದಿನನಿತ್ಯದ ಸ್ಟ್ರೆಚ್ ಲೆಗ್ಗಿಂಗ್ಸ್',29900,'/demo/product-5.svg',10),
 ('innerwear','Soft cotton innerwear','ಮೃದುವಾದ ಕಾಟನ್ ಒಳ ಉಡುಪು',24900,'/demo/product-2.svg',10)
) as p(category_slug,name_en,name_kn,price_paise,image_path,sort_order)
join public.categories c on c.slug=p.category_slug;

insert into public.product_variants(product_id,sku,size,color_en,color_kn,stock_on_hand,low_stock_threshold)
select p.id,upper(left(c.slug,3))||'-'||upper(v.size)||'-'||v.color_code,v.size,v.color_en,v.color_kn,v.stock,2
from public.products p join public.categories c on c.id=p.category_id
cross join (values ('M','Navy','ಕಡು ನೀಲಿ','NVY',8),('L','Navy','ಕಡು ನೀಲಿ','NVY',6),('XL','Maroon','ಕಡು ಕೆಂಪು','MAR',4)) as v(size,color_en,color_kn,color_code,stock)
on conflict(product_id,size,color_en) do nothing;

-- Create the first owner after creating the Auth user in the Supabase dashboard:
-- insert into public.owner_users(user_id,display_name) values ('AUTH_USER_UUID','Shop owner');

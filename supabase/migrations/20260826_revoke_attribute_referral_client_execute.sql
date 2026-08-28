-- Harden attribute_referral: callable only via service_role (admin client).
-- CREATE FUNCTION defaults + role grants left EXECUTE on anon/authenticated.

revoke all on function public.attribute_referral(uuid, text) from public;
revoke all on function public.attribute_referral(uuid, text) from anon;
revoke all on function public.attribute_referral(uuid, text) from authenticated;

grant execute on function public.attribute_referral(uuid, text) to service_role;
grant execute on function public.attribute_referral(uuid, text) to postgres;

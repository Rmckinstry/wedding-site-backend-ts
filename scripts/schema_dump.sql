--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer DEFAULT nextval('public.groups_id_seq'::regclass) NOT NULL,
    group_name character varying NOT NULL
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: guests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guests_id_seq OWNER TO postgres;

--
-- Name: guests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guests (
    guest_id integer DEFAULT nextval('public.guests_id_seq'::regclass) NOT NULL,
    group_id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying,
    plus_one_allowed boolean DEFAULT false,
    has_dependents boolean DEFAULT false,
    added_by_guest_id integer,
    additional_guest_type character varying,
    song_requests integer DEFAULT 2,
    after_party boolean DEFAULT false,
);


ALTER TABLE public.guests OWNER TO postgres;

--
-- Name: rsvps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rsvps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rsvps_id_seq OWNER TO postgres;

--
-- Name: rsvps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rsvps (
    rsvp_id integer DEFAULT nextval('public.rsvps_id_seq'::regclass) NOT NULL,
    guest_id integer NOT NULL,
    attendance boolean,
    spotify character varying,
    dietary_restrictions character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    after_party_attending boolean,
);


ALTER TABLE public.rsvps OWNER TO postgres;

--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: rsvps rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvps
    ADD CONSTRAINT rsvps_pkey PRIMARY KEY (rsvp_id);


--
-- Name: guests users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT users_pkey PRIMARY KEY (guest_id);


--
-- Name: guests added_by_guest_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT added_by_guest_id_fk FOREIGN KEY (added_by_guest_id) REFERENCES public.guests(guest_id) NOT VALID;


--
-- Name: guests group_id_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT group_id_users_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: rsvps rsvps_guests_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvps
    ADD CONSTRAINT rsvps_guests_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(guest_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

